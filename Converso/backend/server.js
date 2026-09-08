require("dotenv").config();

const { createServer } = require("http");
const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
require("./lib/db");

const User = require("./models/User");
const Chat = require("./models/Chat");
const Message = require("./models/Message");
const FriendRequest = require("./models/FriendRequest");
const Notification = require("./models/Notification");

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const onlineUsers = new Map();
const userSessions = new Map();

async function updateLastSeen(username) {
  if (!username) return;
  try {
    await User.updateOne({ username }, { last_seen: new Date() });
  } catch (err) {
    console.error("Error updating last seen:", err);
  }
}

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "Converso Backend API (MongoDB + Mongoose)",
    timestamp: new Date().toISOString(),
  });
});

// Authentication: Login (Supports POST and GET)
const handleLogin = async (req, res) => {
  try {
    const username = (req.body?.username || req.query?.username || "").toLowerCase().trim();
    const password = req.body?.password || req.query?.password;

    if (!username || !password) {
      return res.json({ success: false });
    }

    const user = await User.findOne({ username });
    if (!user || user.password !== password) {
      return res.json({ success: false });
    }

    res.json({ success: true, username: user.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

app.post("/api/login", handleLogin);
app.get("/api/login", handleLogin);


// Authentication: Register
app.post("/api/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ error: "Username and password required" });
    }

    const cleanUsername = username.toLowerCase().trim();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.json({ error: "Username already exists" });
    }

    const user = await User.create({
      username: cleanUsername,
      password,
      regDate: new Date(),
      last_seen: new Date(),
    });

    res.json({
      success: true,
      username: user.username,
      password: user.password,
    });
  } catch (err) {
    console.error("Register error:", err);
    res.json({ error: err.message });
  }
});

// Profile Setup / Update
app.post("/api/register/setprofile", async (req, res) => {
  try {
    const { fname, lname, gender, bio, dob, username, profilePic } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    const cleanUsername = username.toLowerCase().trim();
    const updateData = {};
    if (fname !== undefined) updateData.fname = fname;
    if (lname !== undefined) updateData.lname = lname;
    if (gender !== undefined) updateData.gender = gender;
    if (bio !== undefined) updateData.bio = bio;
    if (dob !== undefined) updateData.DOB = dob;
    if (profilePic !== undefined) updateData.profilePic = profilePic;

    const user = await User.findOneAndUpdate(
      { username: cleanUsername },
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Setprofile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get User Profile
app.get("/api/profile", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ user: null });

    const user = await User.findOne({
      username: username.toLowerCase().trim(),
    });

    res.json({ user: user || null, ...(user ? user.toObject() : {}) });
  } catch (err) {
    console.error("Profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get User Chats (Conversations list)
app.get("/api/chat", async (req, res) => {
  try {
    const { username, password } = req.query;
    if (!username) return res.json({ users: [] });

    const cleanUsername = username.toLowerCase().trim();
    if (password) {
      const authUser = await User.findOne({
        username: cleanUsername,
        password,
      });
      if (!authUser) return res.json({ success: false, users: [] });
    }

    const chats = await Chat.find({ participants: cleanUsername }).sort({
      updatedAt: -1,
    });

    const usersWithChatId = [];
    for (const chat of chats) {
      const otherUsername = chat.participants.find(
        (p) => p.toLowerCase() !== cleanUsername
      );
      if (otherUsername) {
        const otherUser = await User.findOne({ username: otherUsername });
        if (otherUser) {
          usersWithChatId.push({
            ...otherUser.toObject(),
            chat_id: chat._id.toString(),
            lastMessage: chat.lastMessage,
            lastMessageTime: chat.lastMessageTime,
          });
        }
      }
    }

    res.json({ users: usersWithChatId });
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Chat User Info
app.get("/api/chat/chatuser", async (req, res) => {
  try {
    const { username, chatid } = req.query;
    if (!chatid) return res.json({});

    const chat = await Chat.findById(chatid);
    if (!chat) return res.json({});

    const cleanUsername = username ? username.toLowerCase().trim() : "";
    const otherUsername = chat.participants.find(
      (p) => p.toLowerCase() !== cleanUsername
    );

    if (!otherUsername) return res.json({});

    const otherUser = await User.findOne({ username: otherUsername });
    res.json(otherUser || {});
  } catch (err) {
    console.error("Chatuser error:", err);
    res.json({});
  }
});

// Get Chat Messages
app.get("/api/chat/messages", async (req, res) => {
  try {
    const { chatid, sender } = req.query;
    if (!chatid) return res.json({ messages: [] });

    const messages = await Message.find({ chatId: chatid }).sort({ time: 1 });

    const formatted = messages.map((m) => ({
      content: m.content,
      is_sender: m.sender.toLowerCase() === (sender || "").toLowerCase(),
      SENDER: m.sender,
      CHAT_ID: m.chatId,
      time: m.time,
    }));

    res.json({ messages: formatted });
  } catch (err) {
    console.error("Get messages error:", err);
    res.json({ messages: [] });
  }
});

// Post Message
app.post("/api/chat/messages", async (req, res) => {
  try {
    const { message, chatid, sender } = req.body;
    if (!message || !chatid || !sender) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMsg = await Message.create({
      chatId: chatid,
      sender: sender.toLowerCase().trim(),
      content: message,
      time: new Date(),
    });

    await Chat.findByIdAndUpdate(chatid, {
      lastMessage: message,
      lastMessageTime: new Date(),
    });

    res.json({
      is_sender: true,
      content: message,
      time: newMsg.time,
    });
  } catch (err) {
    console.error("Post message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// User Status
app.get("/api/user-status/:username", async (req, res) => {
  try {
    const username = req.params.username.toLowerCase().trim();

    if (onlineUsers.has(username) && onlineUsers.get(username).size > 0) {
      return res.json({
        isOnline: true,
        lastSeen: null,
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      isOnline: false,
      lastSeen: user.last_seen,
    });
  } catch (err) {
    console.error("User status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Search Peers
app.get("/api/search", async (req, res) => {
  try {
    const { username, search } = req.query;
    if (!username) return res.json({ users: [] });

    const cleanUsername = username.toLowerCase().trim();

    // Find existing chats to exclude current friends
    const existingChats = await Chat.find({ participants: cleanUsername });
    const existingFriends = new Set();
    existingChats.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.toLowerCase() !== cleanUsername) existingFriends.add(p.toLowerCase());
      });
    });

    // Find pending sent friend requests to exclude
    const sentRequests = await FriendRequest.find({ sender: cleanUsername });
    const pendingReceivers = new Set(sentRequests.map((r) => r.receiver.toLowerCase()));

    const queryStr = search ? search.trim() : "";
    const excludeList = [cleanUsername, ...existingFriends, ...pendingReceivers];

    const users = await User.find({
      username: {
        $regex: queryStr,
        $options: "i",
        $nin: excludeList,
      },
    }).limit(20);

    res.json({ users });
  } catch (err) {
    console.error("Search error:", err);
    res.json({ users: [] });
  }
});

// Send Friend Request
app.post("/api/search", async (req, res) => {
  try {
    const { username, contactuser } = req.body;
    if (!username || !contactuser) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const sender = username.toLowerCase().trim();
    const receiver = contactuser.toLowerCase().trim();

    const existing = await FriendRequest.findOne({ sender, receiver });
    if (!existing) {
      await FriendRequest.create({ sender, receiver, time: new Date() });
    }

    // Real-time socket notification to receiver
    const receiverCount = await FriendRequest.countDocuments({ receiver });
    const senderUser = await User.findOne({ username: sender });
    io.to(`user:${receiver}`).emit("new-friend-request", {
      sender,
      senderDetails: senderUser,
      count: receiverCount,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Send friend request error:", err);
    res.json({ error: err.message });
  }
});

// Get Incoming Friend Requests Count (Fast for badge indicator)
app.get("/api/friendrequest/count", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ count: 0 });

    const cleanUsername = username.toLowerCase().trim();
    const count = await FriendRequest.countDocuments({ receiver: cleanUsername });
    res.json({ count });
  } catch (err) {
    console.error("Get friend requests count error:", err);
    res.json({ count: 0 });
  }
});

// Get Incoming Friend Requests
app.get("/api/friendrequest", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]);

    const cleanUsername = username.toLowerCase().trim();
    const requests = await FriendRequest.find({ receiver: cleanUsername });
    const senderUsernames = requests.map((r) => r.sender);

    const users = await User.find({ username: { $in: senderUsernames } });
    res.json(users);
  } catch (err) {
    console.error("Get friend requests error:", err);
    res.json([]);
  }
});

// Accept / Decline Friend Request
app.post("/api/friendrequest", async (req, res) => {
  try {
    const { sender, receiver, accepted } = req.body;
    if (!sender || !receiver) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const userA = sender.toLowerCase().trim();
    const userB = receiver.toLowerCase().trim();

    // Remove pending request
    await FriendRequest.deleteMany({
      $or: [
        { sender: userA, receiver: userB },
        { sender: userB, receiver: userA },
      ],
    });

    const msg = accepted
      ? "accepted Your Friend Request"
      : "declined Your Friend Request";

    // Notify userB (who sent the original request)
    await Notification.create({
      username: userB,
      senderuser: userA,
      message: msg,
      time: new Date(),
    });

    // Real-time socket notification for updated badge counts
    const remainingCountA = await FriendRequest.countDocuments({ receiver: userA });
    io.to(`user:${userA}`).emit("friend-request-count-updated", { count: remainingCountA });

    const remainingCountB = await FriendRequest.countDocuments({ receiver: userB });
    io.to(`user:${userB}`).emit("friend-request-count-updated", { count: remainingCountB });
    io.to(`user:${userB}`).emit("friend-request-resolved", {
      by: userA,
      accepted,
    });

    if (!accepted) {
      return res.json({ success: true });
    }

    // Create chat if not exists
    let chat = await Chat.findOne({
      participants: { $all: [userA, userB] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [userA, userB],
        createdAt: new Date(),
      });
    }

    // Notify both users that a new conversation has been unlocked
    if (socketA) io.to(socketA).emit("chat-created", { chatId: chat._id, with: userB });
    if (socketB) io.to(socketB).emit("chat-created", { chatId: chat._id, with: userA });

    res.json({ success: true, id: chat._id.toString() });
  } catch (err) {
    console.error("Resolve friend request error:", err);
    res.json({ error: err.message });
  }
});

// Get Notifications
app.get("/api/notification", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json([]);

    const cleanUsername = username.toLowerCase().trim();
    const notifications = await Notification.find({
      username: cleanUsername,
    }).sort({ time: -1 });

    const enriched = [];
    for (const n of notifications) {
      const senderObj = await User.findOne({ username: n.senderuser });
      enriched.push({
        username: n.username,
        senderuser: n.senderuser,
        message: n.message,
        time: n.time,
        fname: senderObj?.fname || "",
        lname: senderObj?.lname || "",
        gender: senderObj?.gender || "Other",
      });
    }

    res.json(enriched);
  } catch (err) {
    console.error("Get notifications error:", err);
    res.json([]);
  }
});

// Clear Notifications
app.delete("/api/notification", async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.json({ success: true });

    await Notification.deleteMany({
      username: username.toLowerCase().trim(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Clear notifications error:", err);
    res.json({ error: err.message });
  }
});

// ==========================================
// Socket.IO Server Setup
// ==========================================
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  const handleRegisterUser = async (username) => {
    if (!username) return;
    const cleanUser = username.toLowerCase().trim();
    console.log(`${cleanUser} is now online (socket: ${socket.id})`);

    socket.join(`user:${cleanUser}`);
    if (!onlineUsers.has(cleanUser)) {
      onlineUsers.set(cleanUser, new Set());
    }
    onlineUsers.get(cleanUser).add(socket.id);
    userSessions.set(socket.id, { username: cleanUser });

    await updateLastSeen(cleanUser);

    io.emit("user-status-change", {
      username: cleanUser,
      status: "online",
    });
  };

  socket.on("user-online", handleRegisterUser);
  socket.on("register-user", handleRegisterUser);

  socket.on("join-chat", async (data) => {
    const { chatId, username } = data;
    if (!chatId) return;

    const cleanUser = username ? username.toLowerCase().trim() : "";
    socket.join(chatId);
    console.log(`User ${cleanUser} joined chat room: ${chatId} (socket: ${socket.id})`);

    if (cleanUser) {
      socket.join(`user:${cleanUser}`);
      if (!onlineUsers.has(cleanUser)) {
        onlineUsers.set(cleanUser, new Set());
      }
      onlineUsers.get(cleanUser).add(socket.id);

      const session = userSessions.get(socket.id) || {};
      userSessions.set(socket.id, {
        ...session,
        username: cleanUser,
        chatId,
      });

      await updateLastSeen(cleanUser);

      socket.to(chatId).emit("user-status-changed", {
        username: cleanUser,
        isOnline: true,
      });

      socket.to(chatId).emit("user-joined-chat", {
        username: cleanUser,
        chatId,
      });
    }
  });

  socket.on("leave-chat", (data) => {
    const { chatId, username } = data;
    socket.leave(chatId);
    console.log(`User ${username} left chat room: ${chatId}`);

    socket.to(chatId).emit("user-left-chat", {
      username,
      chatId,
    });
  });

  socket.on("send-message", (data) => {
    console.log("Message received via socket:", data);
    io.to(data.chatId).emit("receive-message", data);
  });

  socket.on("typing", (data) => {
    socket.to(data.chatId).emit("user-typing", data);
  });

  // ==========================================
  // WebRTC Audio & Video Calling Signaling
  // ==========================================
  // Initiate call to another peer
  socket.on("call-user", async (data) => {
    const { to, from, callType } = data;
    if (!to || !from) return;

    const cleanTo = to.toLowerCase().trim();
    const cleanFrom = from.toLowerCase().trim();
    const isRecipientOnline = onlineUsers.has(cleanTo) && onlineUsers.get(cleanTo).size > 0;

    console.log(`Call initiated from ${cleanFrom} to ${cleanTo} (${callType}). Online: ${isRecipientOnline}`);

    if (!isRecipientOnline) {
      socket.emit("call-user-offline", { to: cleanTo });
      return;
    }

    const callerUser = await User.findOne({ username: cleanFrom });

    io.to(`user:${cleanTo}`).emit("incoming-call", {
      from: cleanFrom,
      callType: callType || "video",
      callerDetails: callerUser || { username: cleanFrom },
    });
  });

  // Recipient answers call
  socket.on("accept-call", (data) => {
    const { to, from } = data;
    const cleanTo = to.toLowerCase().trim();
    const cleanFrom = from.toLowerCase().trim();
    console.log(`Call accepted by ${cleanFrom} for ${cleanTo}`);

    io.to(`user:${cleanTo}`).emit("call-accepted", {
      from: cleanFrom,
    });
  });

  // Recipient rejects or busy
  socket.on("reject-call", (data) => {
    const { to, from, reason } = data;
    const cleanTo = to.toLowerCase().trim();
    const cleanFrom = from.toLowerCase().trim();
    console.log(`Call rejected by ${cleanFrom} for ${cleanTo} (reason: ${reason})`);

    io.to(`user:${cleanTo}`).emit("call-rejected", {
      from: cleanFrom,
      reason: reason || "declined",
    });
  });

  // Either party ends the call
  socket.on("end-call", (data) => {
    const { to, from } = data;
    const cleanTo = to ? to.toLowerCase().trim() : "";
    const cleanFrom = from ? from.toLowerCase().trim() : "";
    console.log(`Call ended by ${cleanFrom} for ${cleanTo}`);

    if (cleanTo) {
      io.to(`user:${cleanTo}`).emit("call-ended", {
        from: cleanFrom,
      });
    }
  });

  // Forward WebRTC Offer
  socket.on("webrtc-offer", (data) => {
    const { to, from, offer } = data;
    const cleanTo = to.toLowerCase().trim();
    const cleanFrom = from.toLowerCase().trim();
    io.to(`user:${cleanTo}`).emit("webrtc-offer", {
      from: cleanFrom,
      offer,
    });
  });

  // Forward WebRTC Answer
  socket.on("webrtc-answer", (data) => {
    const { to, from, answer } = data;
    const cleanTo = to.toLowerCase().trim();
    const cleanFrom = from.toLowerCase().trim();
    io.to(`user:${cleanTo}`).emit("webrtc-answer", {
      from: cleanFrom,
      answer,
    });
  });

  // Forward ICE Candidate
  socket.on("webrtc-ice-candidate", (data) => {
    const { to, from, candidate } = data;
    const cleanTo = to.toLowerCase().trim();
    const cleanFrom = from.toLowerCase().trim();
    io.to(`user:${cleanTo}`).emit("webrtc-ice-candidate", {
      from: cleanFrom,
      candidate,
    });
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);

    const session = userSessions.get(socket.id);
    if (session && session.username) {
      const { username, chatId } = session;

      if (onlineUsers.has(username)) {
        const userSockets = onlineUsers.get(username);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsers.delete(username);
          await updateLastSeen(username);

          if (chatId) {
            socket.to(chatId).emit("user-status-changed", {
              username,
              isOnline: false,
            });
          }

          io.emit("user-status-change", {
            username,
            status: "offline",
          });

          console.log(`${username} is now fully offline`);
        } else {
          console.log(`${username} still has ${userSockets.size} active socket connection(s)`);
        }
      }

      userSessions.delete(socket.id);
    }
  });

  socket.on("get-online-users", (callback) => {
    if (typeof callback === "function") {
      callback(Array.from(onlineUsers.keys()));
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend server running on port ${PORT} (0.0.0.0)`);
  console.log("📡 Socket.IO ready for connections");
});
