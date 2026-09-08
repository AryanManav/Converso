const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: {
      type: [String],
      required: true,
      index: true,
    },
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageTime: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Chat", chatSchema);
