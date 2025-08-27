const mongoose = require("mongoose");
const dotenv = require("dotenv");
//const {seed} = require("../utils/seed");

dotenv.config();

exports.connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Database connected successfully");
      //seed();
    })
    .catch((error) => {
      console.error("Database connection error:", error);
    });
};
