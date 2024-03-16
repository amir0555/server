const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT Exception! Shutting down ...");
  process.exit(1); // Exit Code 1 indicates that a container shut down, either because of an application failure.
});

const app = require("./app");

const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io"); // Add this
const { promisify } = require("util");
const User = require("./model/user");
const Shop = require("./model/shop");
const FriendRequest = require("./model/friendRequest");
const OneToOneMessage = require("./model/OneToOneMessage");
const connectDatabase = require("./db/Database");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

connectDatabase();
const port = process.env.PORT || 5000;

server.listen(port, () => {
  console.log(`App running on port ${port} ...`);
});

io.on("connection", async (socket) => {
  const user_id = socket.handshake.query["user_id"];
  const type = socket.handshake.query["type"];

  
  console.log(`User connected ${socket.id}`);

  if(type === "User"){
    if (user_id != null && Boolean(user_id)) {
      try {
        await User.findByIdAndUpdate(user_id, {
          socket_id: socket.id,
          status: "Online",
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
    else if(type === "Shop"){

      if (user_id != null && Boolean(user_id)) {
        try {
          await Shop.findByIdAndUpdate(user_id, {
            socket_id: socket.id,
            status: "Online",
          });
        } catch (e) {
          console.log(e);
        }


      }

  }
  

  // We can write our socket event listeners in here...
  socket.on("friend_request", async (data) => {
    const to = await User.findById(data.to).select("socket_id");
    const from = await User.findById(data.from).select("socket_id");

    // create a friend request
    await FriendRequest.create({
      sender: data.from,
      recipient: data.to,
    });
    // emit event request received to recipient
    io.to(to?.socket_id).emit("new_friend_request", {
      message: "New friend request received",
    });
    io.to(from?.socket_id).emit("request_sent", {
      message: "Request Sent successfully!",
    });
  });

  socket.on("accept_request", async (data) => {
    const request_doc = await FriendRequest.findById(data.request_id);
    const sender = await User.findById(request_doc.sender);
    const receiver = await User.findById(request_doc.recipient);
    sender.friends.push(request_doc.recipient);
    receiver.friends.push(request_doc.sender);
    await receiver.save({ new: true, validateModifiedOnly: true });
    await sender.save({ new: true, validateModifiedOnly: true });
    await FriendRequest.findByIdAndDelete(data.request_id);
    io.to(sender?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
    io.to(receiver?.socket_id).emit("request_accepted", {
      message: "Friend Request Accepted",
    });
  });



  socket.on("startFriendship", async (data) => {
    try {
      const user = await User.findById(data.user);
      
      if (user) {
        const seller = user.friends.find((friend) => friend.toString() === data.seller);
        
        if (seller) {
          socket.emit("startFriendship", {
            message: "You are already friends with this seller.",
            status:1
          });
        } else {
          const receiver = await Shop.findById(data.seller);
          
          if (receiver) {
            user.friends.push(receiver._id);
            receiver.friends.push(user._id);
            await receiver.save();
            await user.save();
            socket.emit("startFriendship", {
              message: "Friendship created successfully.",
              status:2
            });
          } else {
            socket.emit("startFriendship", {
              message: "Receiver not found.",
              status:3
            });
          }
        }
      } else {
        socket.emit("startFriendship", {
          message: "User not found.",
          status:4

        });
      }
    } catch (error) {
      console.log(error);
      socket.emit("startFriendship", {
        message: "An error occurred.",
      });
    }
  });
  

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    if(type==="User"){
      const existing_conversations = await OneToOneMessage.find({
        participants: { $all: [user_id] },
      }).populate("seller", "firstname lastname avatar _id email status");
      callback(existing_conversations);
    }else if(type === "Shop"){
      const existing_conversations = await OneToOneMessage.find({
        seller: { $all: [user_id] },
      }).populate("participants", "firstname lastname avatar _id email status");
      callback(existing_conversations);
    }
  });

  socket.on("start_conversation", async (data) => {
    const { to, from } = data;
    const existing_conversations = await OneToOneMessage.find({
      seller: [to], participants: [from],
    }).populate("seller", "firstname lastname _id email status");

    if (existing_conversations.length === 0) {
      let new_chat = await OneToOneMessage.create({
        participants: [from],
        seller:[to]
      });

      new_chat = await OneToOneMessage.findById(new_chat).populate(
        "seller",
        "firstname lastname _id email avatar status"
      ); 
      socket.emit("start_chat", new_chat);
    }
    // if yes => just emit event "start_chat" & send conversation details as payload
    else {
      socket.emit("start_chat", existing_conversations[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      const { messages } = await OneToOneMessage.findById(
        data.conversation_id
       ).select("messages");
       callback(messages);
    } catch (error) {
      console.log(error);
    }
  });

  // Handle incoming text/link messages
  socket.on("text_message", async (data) => {
    const { message, conversation_id, from, to, type } = data;
    

    const Type = socket.handshake.query["type"];
       let to_user ={}
       let from_user ={}


    if(Type=== "User"){
       to_user = await Shop.findById(to);
       from_user = await User.findById(from);
    }if(Type=== "Shop"){
       to_user = await Shop.findById(from);
       from_user = await User.findById(to);
    }


    // message => {to, from, type, created_at, text, file}
    let new_message = {
      to: to_user._id,
      from: from_user._id,
      type: type,
      created_at: Date.now(),
      text: message,

    };

     if(Type=== "User"){
       new_message = {
        client: from_user._id,
        type: type,
        created_at: Date.now(),
        text: message,
      };
    }else if (Type=== "Shop"){
      new_message = {
        seller: to_user._id,
        type: type,
        created_at: Date.now(),
        text: message,
      };
    }

    // fetch OneToOneMessage Doc & push a new message to existing conversation
    const chat = await OneToOneMessage.findById(conversation_id);
    chat.messages.push(new_message);
    // save to db`
    await chat.save({ new: true, validateModifiedOnly: true });
    if(Type === "User"){
      io.to(socket.id).emit("new_message", {
        conversation_id,
        message: new_message,
      })
      io.to(to_user?.socket_id).emit("new_message", {
        conversation_id,
        message: new_message,
      });
    }else{
      io.to(socket.id).emit("new_message", {
        conversation_id,
        message: new_message,
      })
      io.to(from_user?.socket_id).emit("new_message", {
        conversation_id,
        message: new_message,
      });

    }
  });

  // handle Media/Document Message
/*  socket.on("file_message", upload.single("file"), async (data) => {
    // data: {to, from, text, file}
  
    const { file, bod } = req;
    const { to, from, text } = data;
  
    try {
      // Save the file path or other relevant file information to your database
      const filePath = file.path;
  
      // Create or retrieve the conversation
      const conversation = await OneToOneMessage.findById(conversation_id);
      if (!conversation) {
        // Create a new conversation if it doesn't exist
        const newConversation = new OneToOneMessage({
          // Initialize conversation properties
        });
        conversation = await newConversation.save();
      }
  
      // Create a new message
      const newMessage = {
        to: to,
        from: from,
        type: "file",
        created_at: Date.now(),
        text:filePath,
      };
  
      // Push the new message to the conversation and save it
      conversation.messages.push(newMessage);
      await conversation.save();
  
      // Emit events to the relevant users
      io.to(to).emit("incoming_message", { conversation_id, message: newMessage });
      io.to(from).emit("outgoing_message", { conversation_id, message: newMessage });
    } catch (error) {
      console.error(error);
      // Handle any errors that occur during the process
    }
  });*/


  socket.on("end", async (data) => {
    // Find user by ID and set status as offline

    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
      await Shop.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }

    // broadcast to all conversation rooms of this user that this user is offline (disconnected)

    socket.disconnect(0);
  });
});

process.on("unhandledRejection", (err) => {
  console.log(err);
  console.log("UNHANDLED REJECTION! Shutting down ...");
  server.close(() => {
    process.exit(1); //  Exit Code 1 indicates that a container shut down, either because of an application failure.
  });
});
