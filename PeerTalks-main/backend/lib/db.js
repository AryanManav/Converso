const mongoose = require("mongoose");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/peertalks";

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🍃 MongoDB Connected successfully");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err.message);
    console.log(
      "💡 Tip: Ensure MongoDB is running locally or provide a valid MONGODB_URI in backend/.env"
    );
  }
}

connectDB();

module.exports = {
  connectDB,
};
