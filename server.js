const { default: mongoose } = require("mongoose");
const app = require("./app");
const connectDatabase = require("./db/Database");

// Handling uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server for handling uncaught exception");
  process.exit(1);
});

// config
require("dotenv").config({
  path: "/.env",
});

const PORT = process.env.SERVER || 5000;

mongoose.set("strictQuery", false);

const start = () => {
  mongoose
    .connect(`${process.env.DB_URL}`, { useUnifiedTopology: true })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`server is listening on  http://localhost:${PORT}`);
      });
    })
    .catch((error) => console.log(error));
};
start();

// Unhandled promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Shutting down the server for ${err.message}`);
  console.log("Shutting down the server for unhandled promise rejection");
  server.close(() => {
    process.exit(1);
  });
});

// -- NAMECHEAP VPS PASSWORD --- //
// Password: 8fcWPklWBGX94p67u5
