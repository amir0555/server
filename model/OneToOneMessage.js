const mongoose = require("mongoose");

const oneToOneMessageSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "User",
    },
  ],
  seller: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Shop",
    },
  ],
  messages: [
    {
      client: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
      seller: {
        type: mongoose.Schema.ObjectId,
        ref: "Shop",
      },
      type: {
        type: String,
        enum: ["Text", "Media", "Document", "Link"],
      },
      created_at: {
        type: Date,
        default: Date.now(),
      },
      text: {
        type: String,
      },
      file: {
        type: String,
      },
    },
  ],
});

const OneToOneMessage = new mongoose.model(
  "OneToOneMessage",
  oneToOneMessageSchema
);
module.exports = OneToOneMessage;
