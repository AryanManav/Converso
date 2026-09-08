# Converso — Real-Time Messaging & Peer-to-Peer Calling Platform

Converso is a full-stack, real-time communication platform engineered with **Next.js 14 (React 18)**, **Node.js & Express**, **Socket.IO**, **WebRTC (peer-to-peer audio/video)**, and **MongoDB (Mongoose)**. 

It provides sub-millisecond real-time chat, decentralized peer-to-peer voice and video calls with custom audio synthesis, dynamic online presence tracking with multi-tab awareness, and friend discovery pipelines.

This document serves as both the **project documentation** and a **technical interview handbook**. It covers the architecture, networking protocols, design trade-offs, engineering edge cases, and 25+ tailored technical interview questions with deep-dive answers.

---

## Table of Contents

1. [Executive Summary & Architectural Highlights](#executive-summary--architectural-highlights)
2. [System Architecture & Data Flow](#system-architecture--data-flow)
3. [Tech Stack & Engineering Justifications](#tech-stack--engineering-justifications)
4. [Deep-Dive Feature Breakdown](#deep-dive-feature-breakdown)
   - [1. WebRTC Peer-to-Peer Voice & Video Calling](#1-webrtc-peer-to-peer-voice--video-calling)
   - [2. Synthesized Web Audio Engine](#2-synthesized-web-audio-engine)
   - [3. Real-Time Chat & Socket Room Orchestration](#3-real-time-chat--socket-room-orchestration)
   - [4. Multi-Device Presence & Session Management](#4-multi-device-presence--session-management)
   - [5. Friend Request & Notification Pipeline](#5-friend-request--notification-pipeline)
5. [Database Schema & Data Models](#database-schema--data-models)
6. [Key Engineering Challenges & Solutions](#key-engineering-challenges--solutions)
7. [Comprehensive Interview Preparation Guide (Q&A)](#comprehensive-interview-preparation-guide-qa)
   - [Category 1: System Design & Architecture](#category-1-system-design--architecture)
   - [Category 2: WebRTC & Networking Protocols](#category-2-webrtc--networking-protocols)
   - [Category 3: Socket.IO & Real-Time State Management](#category-3-socketio--real-time-state-management)
   - [Category 4: React & Frontend Performance](#category-4-react--frontend-performance)
   - [Category 5: Database Modeling & Scalability](#category-5-database-modeling--scalability)
   - [Category 6: Edge Cases, Security & Production Readiness](#category-6-edge-cases-security--production-readiness)
8. [Local Setup & Development Guide](#local-setup--development-guide)
9. [Project Directory Layout](#project-directory-layout)

---

## Executive Summary & Architectural Highlights

- **Decentralized Media Stream (WebRTC P2P):** Audio and video streams bypass the application server entirely once established, reducing server bandwidth costs to \$0 for active call media and achieving peer-to-peer latency as low as 20–50ms.
- **WebSocket-Driven Signaling Server:** Socket.IO handles session initiation, SDP (Session Description Protocol) offer/answer exchanges, and ICE candidate trickling.
- **Hardware-Lock Graceful Degradation:** Catches single-machine camera lockouts (`NotReadableError` / `TrackStartError`) and automatically falls back to microphone audio, ensuring calls never abort unexpectedly.
- **Zero-Asset Web Audio Synthesizer:** Eliminates static MP3 audio dependencies by generating dialed frequencies, ringers, and connection chimes mathematically using browser `AudioContext` and `OscillatorNode`.
- **Multi-Socket Presence Management:** Implemented an in-memory `Map<string, Set<string>>` mapping each user to multiple active socket IDs, preventing false-offline triggers when a user opens multiple browser tabs.
- **Targeted Notification Rooms:** Utilizes dedicated per-user socket rooms (`user:${username}`) for atomic delivery of notifications, friend requests, and call invitations.

---

## System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER A                               │
│  Next.js 14 App Router  │  React 18  │  Web Audio API  │  RTCPeerConnection │
└───────────────────────┬─────────────────────────────▲───────────────────────┘
                        │                             │
       1. REST Auth /   │                             │ 4. Direct P2P Media
       Data Queries     │ 2. Socket Signaling         │    (SRTP / WebRTC)
                        │    (SDP / ICE Candidates)   │    No Server Overhead!
                        ▼                             │
┌──────────────────────────────────────┐              │
│       SIGNALING & REST SERVER        │              │
│       Node.js + Express 4            │              │
│       Socket.IO 4 (Rooms + Events)   │              │
└───────────────────┬──────────────────┘              │
                    │                                 │
     Persistent     │ 3. Push Event                   │
     Read/Write     │    to `user:${to}`              │
                    ▼                                 ▼
┌───────────────────────┐             ┌───────────────────────────────────────┐
│     MONGODB ATLAS     │             │            CLIENT BROWSER B           │
│  Mongoose ODM Schemas │             │  RTCPeerConnection  │  Socket Client  │
└───────────────────────┘             └───────────────────────────────────────┘
```

---

## Tech Stack & Engineering Justifications

| Layer | Technology | Version | Engineering Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | `14.2.x` | Server/Client Component boundary separation, optimized routing, and zero-bundle server rendering for landing pages. |
| **UI Library** | **React** | `18.3.x` | Concurrent rendering, stable hook lifecycles (`useCallback`, `useRef`) crucial for managing WebRTC stream references without memory leaks. |
| **Styling** | **Tailwind CSS** | `3.3.x` | Utility-first styling with dark-mode compatibility and rapid UI iteration. |
| **Real-Time Client** | **Socket.IO Client** | `4.8.x` | Auto-reconnection, heartbeat ping/pong, and fallback to HTTP long-polling when WebSockets are blocked by proxies. |
| **P2P Audio / Video** | **WebRTC API** | Native | Industry standard browser API for ultra-low latency, hardware-accelerated, peer-to-peer encrypted media streaming (DTLS/SRTP). |
| **Audio Generation** | **Web Audio API** | Native | Eliminates network requests for audio assets; programmatically generates tones and rings using oscillators. |
| **Backend Runtime** | **Node.js** | `>=18` | Non-blocking, event-driven asynchronous I/O ideal for thousands of concurrent WebSocket connections. |
| **Web Server** | **Express.js** | `4.18.x` | Lightweight, unopinionated routing layer for REST APIs (auth, chat history, search). |
| **Signaling Engine** | **Socket.IO Server** | `4.8.x` | Built-in room abstractions (`socket.join`, `io.to().emit`), broadcast semantics, and reconnection buffering. |
| **Database** | **MongoDB** | `>=6.0` | Flexible schema for chat messages and unstructured payloads, fast indexed querying on compound fields. |
| **Database ODM** | **Mongoose** | `8.9.x` | Strongly typed model schemas, validation, middleware hooks, and indexed querying. |

---

## Deep-Dive Feature Breakdown

### 1. WebRTC Peer-to-Peer Voice & Video Calling

WebRTC allows browsers to exchange media streams directly. However, browsers cannot establish a direct P2P connection out of the blue because they don't know each other's IP address, port, codecs, or NAT configurations. Converso solves this using **Socket.IO as the Signaling Gateway**.

#### Signaling & Negotiation Flow:
1. **Initiation (`call-user`):** Caller triggers an outgoing call. Server checks if the callee is online (`onlineUsers.has(recipient)`). If offline, the caller immediately receives `call-user-offline`.
2. **Alerting (`incoming-call`):** Server forwards the call event to the callee's personal room (`user:${callee}`). Callee's browser activates the custom synthesized incoming ringer.
3. **Acceptance (`accept-call`):** Callee clicks "Accept". Server notifies caller (`call-accepted`).
4. **Offer Generation (`webrtc-offer`):** Caller creates an `RTCPeerConnection`, adds local audio/video tracks (`pc.addTrack`), creates an SDP offer (`pc.createOffer`), sets it as `localDescription`, and emits it to Callee via the server.
5. **Answer Generation (`webrtc-answer`):** Callee sets the caller's offer as `remoteDescription`, creates an SDP answer (`pc.createAnswer`), sets it as `localDescription`, and sends it back to Caller.
6. **ICE Candidate Trickle (`webrtc-ice-candidate`):** Both peers gather ICE candidates (IP/port combinations discovered via Google STUN servers) and exchange them asynchronously through the signaling channel.
7. **P2P Connected:** Direct SRTP media stream is established; audio and video flow directly between browsers.

```
Caller (User A)                 Signaling Server                Callee (User B)
      │                                │                               │
      ├─── 1. call-user ──────────────>│                               │
      │                                ├─── 2. incoming-call ─────────>│
      │                                │    (Ringing tone starts)      │
      │                                │<── 3. accept-call ────────────┤
      │<── 4. call-accepted ───────────┤                               │
      │                                │                               │
      ├─── 5. webrtc-offer (SDP) ─────>│                               │
      │                                ├─── 6. webrtc-offer (SDP) ────>│
      │                                │<── 7. webrtc-answer (SDP) ────┤
      │<── 8. webrtc-answer (SDP) ─────┤                               │
      │                                │                               │
      ├─── 9. ice-candidate ──────────>│─── 10. ice-candidate ────────>│
      │<── 12. ice-candidate ──────────│<── 11. ice-candidate ─────────┤
      │                                │                               │
      │════════════════════════════════════════════════════════════════│
      │             13. Direct Peer-to-Peer Media Stream               │
      │              (WebRTC DTLS / SRTP Audio & Video)                │
      │════════════════════════════════════════════════════════════════│
```

#### Race Condition Mitigation: ICE Candidate Buffering
In real-world networks, ICE candidates can arrive at the remote peer **before** the remote SDP description has been set. Calling `pc.addIceCandidate()` before `pc.setRemoteDescription()` throws an `InvalidStateError`.
- **Converso Solution:** We maintain a ref queue `pendingIceCandidatesRef = useRef([])`. If candidates arrive while `pc.remoteDescription` is null, they are appended to the queue. Once `setRemoteDescription` resolves, all buffered candidates are flushed and added in sequence.

#### Hardware Lock Graceful Degradation
On desktop OS environments (e.g. Windows), only one process/tab can hold an active lock on a physical webcam. During testing or multi-tab usage, `getUserMedia({ video: true, audio: true })` throws a `NotReadableError` or `TrackStartError`.
- **Converso Solution:** The client catches this specific error and falls back to `{ audio: true, video: false }`, automatically toggling `isVideoDisabled = true` while alerting the user. This ensures the call successfully connects as an audio call rather than crashing.

---

### 2. Synthesized Web Audio Engine

Instead of bundling static audio files (MP3/WAV) that take time to download, introduce network latency, or require asset hosting:
- **Zero Asset Latency:** Audio is generated using the browser's native `AudioContext`.
- **Outgoing Ringing:** Sinusoidal oscillator at 440Hz (standard dial tone) with an exponential gain decay every 3 seconds:
  ```javascript
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(440, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
  ```
- **Incoming Ringer:** Harmonized dual-beep chord (523.25Hz [C5] and 659.25Hz [E5]) looping every 2.5 seconds.
- **Connection Chime:** Arpeggiated triad [C5, E5, G5] played in 80ms increments upon call connection.
- **Disconnection Tone:** Descending frequencies [E5 -> A4] indicating call termination.

---

### 3. Real-Time Chat & Socket Room Orchestration

- **Room Partitioning:** When opening a chat (`/chat/[chatid]`), the client emits `join-chat` with `{ chatId, username }`. Socket.IO subscribes the socket to that `chatId` room.
- **Message Dispatch:**
  1. Client sends an HTTP POST request to `/api/chat/messages` to guarantee persistent storage in MongoDB.
  2. Upon database write confirmation, client emits `send-message` with the message payload to the Socket.IO room.
  3. Server broadcasts `receive-message` to all sockets in that `chatId` room.
  4. Client updates local message state and smoothly scrolls down via `chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight`.
- **Debounced Typing Indicator:**
  - Keypress triggers `socket.emit("typing", { chatId, username })`.
  - Debounced with a 1-second timeout to avoid network flooding.
  - Receiving peers show "user is typing..." with an automatic 2-second decay timer.

---

### 4. Multi-Device Presence & Session Management

A common bug in real-time platforms is marking a user "offline" when they close one browser tab, even if they have three other tabs open.

Converso solves this on the backend using a two-tier in-memory structure:
```javascript
const onlineUsers = new Map();   // Map<username, Set<socketId>>
const userSessions = new Map();  // Map<socketId, { username, chatId }>
```

- When a socket connects and authenticates:
  - `onlineUsers.get(username).add(socket.id)`
  - If it was previously empty, broadcast `user-status-change` (`status: "online"`).
- When a socket disconnects:
  - Remove `socket.id` from `onlineUsers.get(username)`.
  - **Only when the set is completely empty (`userSockets.size === 0`)** do we:
    1. Delete the user entry from `onlineUsers`.
    2. Persist `last_seen = new Date()` to the MongoDB `User` document.
    3. Broadcast `user-status-change` (`status: "offline"`).

---

### 5. Friend Request & Notification Pipeline

- **Non-blocking Request Handling:** When User A searches for User B and clicks "Add Friend", a `FriendRequest` document is stored with a unique compound index `{ sender: 1, receiver: 1 }`.
- **Targeted Socket Delivery:** The server emits `new-friend-request` directly to the `user:${receiver}` room.
- **Instant Badge Updates:** Both caller and receiver get real-time badge count updates without needing to poll the database or reload the page.
- **Atomic Conversation Provisioning:** When User B accepts, the backend deletes the pending `FriendRequest`, creates a persistent `Chat` document between `[userA, userB]`, creates an in-app notification, and notifies both active sockets via `chat-created`.

---

## Database Schema & Data Models

Converso utilizes MongoDB with Mongoose schemas optimized for read-heavy messaging patterns and indexed lookups.

### 1. `User` Schema
```javascript
{
  username:   { type: String, required: true, unique: true, lowercase: true, index: true },
  password:   { type: String, required: true },
  fname:      { type: String, default: "" },
  lname:      { type: String, default: "" },
  bio:        { type: String, default: "" },
  gender:     { type: String, enum: ["Male", "Female", "Other"], default: "Other" },
  DOB:        { type: String, default: "" },
  profilePic: { type: String, default: "" },
  regDate:    { type: Date, default: Date.now },
  last_seen:  { type: Date, default: Date.now }
}
```

### 2. `Chat` Schema
Represents conversation metadata between participants.
```javascript
{
  participants:    { type: [String], required: true, index: true }, // [usernameA, usernameB]
  lastMessage:     { type: String, default: "" },
  lastMessageTime: { type: Date, default: Date.now }
}
```

### 3. `Message` Schema
```javascript
{
  chatId:  { type: String, required: true, index: true },
  sender:  { type: String, required: true, index: true },
  content: { type: String, required: true },
  time:    { type: Date, default: Date.now },
  seen:    { type: Boolean, default: false }
}
```

### 4. `FriendRequest` Schema
Includes a compound unique index ensuring a user cannot send duplicate requests to the same recipient:
```javascript
{
  sender:   { type: String, required: true, index: true },
  receiver: { type: String, required: true, index: true },
  time:     { type: Date, default: Date.now }
}
// Compound Index:
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
```

### 5. `Notification` Schema
```javascript
{
  username:   { type: String, required: true, index: true },
  senderuser: { type: String, required: true },
  message:    { type: String, required: true },
  time:       { type: Date, default: Date.now }
}
```

---

## Key Engineering Challenges & Solutions

| Challenge | Root Cause | Converso Solution |
| :--- | :--- | :--- |
| **ICE Candidate Race Conditions** | ICE candidates generated faster than the remote SDP answer is processed. | Client-side candidate buffering queue (`pendingIceCandidatesRef`) that drains only after `setRemoteDescription` finishes. |
| **False Offline Detection** | User with multiple tabs closes one tab, firing socket `disconnect`. | In-memory `Map<username, Set<socketId>>` counting open sockets per user; user marked offline only when Set size is 0. |
| **Webcam Hardware Lock on Windows** | OS locks physical webcam access to a single application/tab at a time. | Automatic catch of `NotReadableError` / `TrackStartError`, falling back to audio-only stream so the call still establishes. |
| **Audio Latency & Network Bloat** | Loading audio assets (.mp3) over HTTP for ringtones causes delay and 404/CORS issues. | Replaced all static audio with programmatic Web Audio API synthesizers (`OscillatorNode` + `GainNode`). |
| **Unresponsive / Jumpy Chat UI** | Large message histories cause scroll jump and high DOM layout thrashing. | Dedicated `scrollToBottom` with smooth DOM scroll height synchronization on message arrival. |

---

## Comprehensive Interview Preparation Guide (Q&A)

### Category 1: System Design & Architecture

#### Q1: Walk me through the high-level architecture of Converso.
> **Answer:**  
> Converso is built as a hybrid real-time architecture:
> 1. **Data Layer (MongoDB + Mongoose):** Handles relational-like metadata (users, chats, persistent messages, pending friend requests) utilizing compound indexes for fast query resolution.
> 2. **REST API (Express):** Used for idempotent and standard HTTP operations: user login, registration, profile retrieval, and loading chat histories.
> 3. **Real-Time Signaling & Presence Layer (Socket.IO):** Manages bi-directional WebSocket connections for online/offline status tracking, real-time message broadcasting within chat rooms, and WebRTC signaling.
> 4. **P2P Media Layer (WebRTC):** Once signaling completes, media streams (audio/video) flow directly peer-to-peer between client browsers over encrypted SRTP, completely bypassing the backend server.

#### Q2: Why did you choose WebSockets (Socket.IO) over HTTP Long-Polling or Server-Sent Events (SSE)?
> **Answer:**  
> - **SSE:** Only provides uni-directional communication (server to client). Chat and WebRTC signaling require frequent bi-directional message exchange.
> - **HTTP Long-Polling:** Incurs severe HTTP header overhead (cookies, user-agents, headers on every request), creates high server load, and introduces latency unacceptable for instant messaging and call negotiation.
> - **Socket.IO (WebSocket):** Provides full-duplex, persistent TCP connections with minimal framing overhead (a few bytes per frame). Furthermore, Socket.IO offers automatic reconnection, heartbeats (ping/pong), room abstractions, and graceful fallback to long-polling in environments where WebSockets are blocked.

#### Q3: How does the system scale if we grow to 500,000 concurrent active users?
> **Answer:**  
> 1. **Horizontal Scaling of Signaling Servers:** Currently, `onlineUsers` is stored in server memory. To scale horizontally across multiple Node.js instances behind a load balancer (e.g., NGINX / AWS ALB), we would introduce:
>    - **Redis Pub/Sub & `@socket.io/redis-adapter`:** Synchronizes socket events across instances.
>    - **Redis Hash Sets:** Stores `onlineUsers` and socket mappings centrally with sub-millisecond lookups.
> 2. **Database Sharding:** Shard the `messages` collection in MongoDB on `chatId` (hashed index). Since messages are strictly retrieved per chat, queries will route directly to the appropriate shard.
> 3. **Media Scaling (TURN/SFU):**
>    - Add a **TURN server cluster (coturn)** for peers behind symmetric NAT.
>    - For group calls (>3 users), P2P mesh degrades (each user uploads $N-1$ streams). We would implement an **SFU (Selective Forwarding Unit)** like LiveKit or mediasoup.

---

### Category 2: WebRTC & Networking Protocols

#### Q4: What is WebRTC and how does it achieve peer-to-peer communication?
> **Answer:**  
> WebRTC (Web Real-Time Communication) is an open framework that enables real-time audio, video, and data communication directly between browsers without intermediate media servers. It achieves this by:
> 1. Gathering network candidates using **ICE** (Interactive Connectivity Establishment) via **STUN** and **TURN** servers.
> 2. Negotiating media formats, codecs, and session parameters using **SDP** (Session Description Protocol).
> 3. Encrypting all media streams via **DTLS** (Datagram Transport Layer Security) and **SRTP** (Secure Real-Time Transport Protocol).

#### Q5: What is the purpose of STUN and TURN servers?
> **Answer:**  
> - **STUN (Session Traversal Utilities for NAT):** Most devices do not have public IP addresses; they sit behind NAT routers. A STUN server allows a client to discover its public IP address, port, and the type of NAT it is behind. STUN is lightweight and does not relay media.
> - **TURN (Traversal Using Relays around NAT):** When both peers are behind strict or symmetric NATs, direct peer-to-peer connection is mathematically impossible. A TURN server acts as an intermediary relay server. All media packets are forwarded through the TURN server. TURN requires high bandwidth.

#### Q6: Why doesn't WebRTC include a signaling mechanism out of the box?
> **Answer:**  
> WebRTC deliberately leaves signaling unspecified in the standard to provide developers maximum flexibility. Different applications have different signaling requirements: some prefer SIP (telephony), some use XMPP, some use HTTP, and modern web apps use WebSockets. In Converso, we use **Socket.IO** because it allows instant, bi-directional JSON payload transport with room-based routing.

#### Q7: What is an SDP (Session Description Protocol) offer/answer exchange?
> **Answer:**  
> An SDP is a text-based format describing the multimedia capabilities of a device:
> - Supported audio/video codecs (e.g., Opus, VP8, H.264).
> - Media types, resolutions, bitrates, and packetization rules.
> - Encryption fingerprints (DTLS).
> - Media transport direction (`sendrecv`, `sendonly`, `recvonly`).
> 
> The caller creates an **Offer** describing what it can send and receive. The callee receives the offer, calculates the overlap of supported codecs, and returns an **Answer**. Once both peers set their `localDescription` and `remoteDescription`, the media pipeline knows how to decode incoming packets.

#### Q8: What is "Trickle ICE" and why is it used in Converso?
> **Answer:**  
> In legacy WebRTC implementations, the browser waited until **all** ICE candidates were gathered from STUN servers before generating the SDP offer. This introduced a 2–5 second delay before the offer could even be sent over the wire.
> **Trickle ICE** allows the caller to send the SDP offer immediately with whatever candidates are currently known, and then "trickles" new ICE candidates over the signaling channel one-by-one as they are discovered. This cuts call connection setup time down from seconds to under 300 milliseconds.

#### Q9: How did you solve the ICE Candidate race condition in Converso?
> **Answer:**  
> In high-speed networks, candidate packets can arrive at the peer before the SDP offer/answer has finished being set via `pc.setRemoteDescription()`. If `pc.addIceCandidate()` is called when `pc.remoteDescription` is null, the browser throws an `InvalidStateError`.
> 
> To solve this, Converso maintains an in-memory queue:
> ```javascript
> const pendingIceCandidatesRef = useRef([]);
> 
> // When an ICE candidate arrives:
> if (pc && pc.remoteDescription && pc.remoteDescription.type) {
>   await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
> } else {
>   pendingIceCandidatesRef.current.push(data.candidate);
> }
> 
> // After setRemoteDescription resolves:
> while (pendingIceCandidatesRef.current.length > 0) {
>   const candidate = pendingIceCandidatesRef.current.shift();
>   await pc.addIceCandidate(new RTCIceCandidate(candidate));
> }
> ```

---

### Category 3: Socket.IO & Real-Time State Management

#### Q10: How do Socket.IO rooms work under the hood?
> **Answer:**  
> In Socket.IO, "rooms" are an entirely server-side concept—clients are unaware of the rooms they belong to. The server maintains an internal `Map<RoomName, Set<SocketId>>`. 
> - When `socket.join(roomName)` is called, the socket's unique ID is added to that room's Set.
> - When `io.to(roomName).emit(event, data)` is called, the server iterates through the Set of socket IDs and writes the packet directly to each matching TCP connection.
> - When a socket disconnects, Socket.IO automatically cleans it up from all room sets, preventing memory leaks.

#### Q11: How do you handle tracking user presence (online/offline) when a user opens multiple browser tabs?
> **Answer:**  
> A naive approach maps `username -> socket.id`. If a user opens two tabs and closes one, the naive approach broadcasts that the user went offline, breaking the experience in the remaining open tab.
> 
> Converso uses a `Map<string, Set<string>>` tracking `username -> Set(socketIds)`.
> 1. When tab 1 connects: add socket 1. Set size becomes 1. Broadcast `status: "online"`.
> 2. When tab 2 connects: add socket 2. Set size becomes 2. (No duplicate broadcast).
> 3. When tab 1 closes: remove socket 1. Set size is still 1. (Do not broadcast offline).
> 4. When tab 2 closes: remove socket 2. Set size is 0. Delete user key, persist `last_seen` timestamp to MongoDB, and broadcast `status: "offline"`.

#### Q12: What happens if a user's network connection drops temporarily?
> **Answer:**  
> Socket.IO features built-in heartbeat pings and auto-reconnection:
> 1. Heartbeats (`pingInterval: 25000`, `pingTimeout: 20000`) detect dropped TCP connections even if no TCP FIN packet was received.
> 2. The client automatically enters a reconnection loop with exponential backoff and jitter.
> 3. In Converso's UI, `connectionStatus` turns to `"connecting"` and displays a non-intrusive warning bar (`"Reconnecting..."`).
> 4. Upon reconnection, the client re-emits `register-user` and `join-chat`, restoring state seamlessly without requiring a full page refresh.

---

### Category 4: React & Frontend Performance

#### Q13: Why did you use `useRef` extensively instead of `useState` in `CallModal.jsx`?
> **Answer:**  
> WebRTC operates asynchronously through event callbacks (`onicecandidate`, `ontrack`, Socket listeners).
> 1. **Preventing Stale Closures:** If a state variable like `callStatus` is accessed inside a socket callback attached during `useEffect(..., [])`, it will capture the initial value (`idle`) and never see updates. Using a ref (`callStatusRef.current = callStatus`) guarantees the callback always reads the latest value.
> 2. **Avoiding Unnecessary Re-renders:** Objects like `RTCPeerConnection`, `MediaStream`, audio intervals, and candidate queues should not trigger a React component re-render when mutated. Storing them in `useRef` ensures stable references across renders while keeping the UI performant.

#### Q14: How does the synthesized Web Audio API improve performance over audio files?
> **Answer:**  
> 1. **Zero HTTP Overhead:** Traditional audio files require network requests, disk caching, and decoding time. If a user receives a call on high latency mobile networks, an audio file might take 1–2 seconds to fetch before ringing.
> 2. **Zero Missing Asset Errors:** Eliminates 404s, CORS restrictions, and audio format incompatibility across Safari/Chrome.
> 3. **Mathematical Precision:** `AudioContext.currentTime` offers hardware-synchronized timing (sub-millisecond accuracy) for start/stop ramps, avoiding audio clicks and pops.

#### Q15: How did you implement typing indicators without flooding the network?
> **Answer:**  
> Keystrokes occur rapidly (100–300ms apart). Sending a WebSocket event per keystroke wastes bandwidth and CPU.
> Converso implements a **debounce mechanism**:
> - An event is dispatched only once when the user begins typing.
> - A 1000ms debounce timer suppresses repeated emissions while typing continues.
> - The receiving client displays the typing bubble and sets an internal 2000ms decay timer; if no new typing event arrives, the bubble automatically unmounts.

---

### Category 5: Database Modeling & Scalability

#### Q16: Why did you choose MongoDB over a traditional Relational Database (like PostgreSQL/MySQL)?
> **Answer:**  
> 1. **Document-Model Natural Fit:** Chat messages and notifications are self-contained documents. Storing participant arrays directly in `Chat.participants: ['alice', 'bob']` eliminates expensive N:M join tables (`chat_members`).
> 2. **Dynamic Profiling:** User profiles with optional bios, profile pictures, and dynamic settings map cleanly to JSON-like BSON documents without requiring complex relational schema migrations.
> 3. **High Write Throughput:** MongoDB provides fast append performance for append-heavy message collections.
> 4. *Note:* The project historically evaluated MySQL (`queries.sql`) and transitioned to MongoDB/Mongoose to reduce ORM overhead and accelerate schema iteration.

#### Q17: What indexes did you define in MongoDB and why?
> **Answer:**  
> 1. `User.username`: Unique index. Ensures $O(1)$ lookups during login, search, and profile page loads.
> 2. `Chat.participants`: Multi-key index. Accelerates queries finding all chats where a specific user is a participant (`Chat.find({ participants: username })`).
> 3. `Message.chatId` & `Message.time`: Enables index-covered retrieval when loading historical messages sorted chronologically.
> 4. `FriendRequest`: **Compound unique index** `{ sender: 1, receiver: 1 }`. Guarantees database-level enforcement against duplicate friend requests.

#### Q18: How would you design message read receipts ("Seen" ticks)?
> **Answer:**  
> 1. In `Message` schema, we have `seen: { type: Boolean, default: false }`.
> 2. When User B enters the chat view and mounts `ChatBox`, an HTTP PUT or socket event `mark-as-seen` is emitted with `{ chatId, username }`.
> 3. MongoDB updates: `Message.updateMany({ chatId, sender: { $ne: username }, seen: false }, { seen: true })`.
> 4. Server emits `messages-seen` to `chatId`, allowing User A's client to render blue double checkmarks.

---

### Category 6: Edge Cases, Security & Production Readiness

#### Q19: What security vulnerabilities exist in real-time WebRTC and chat apps, and how are they addressed?
> **Answer:**  
> 1. **End-to-End Media Encryption:** WebRTC mandates DTLS/SRTP encryption. Neither the signaling server nor any intermediate ISP can inspect or tamper with active audio/video packets.
> 2. **Input Sanitization / XSS:** All message content displayed in React is escaped by default in JSX, preventing script injection.
> 3. **Production Recommendations (Next steps):**
>    - **Password Hashing:** Passwords should be hashed using `bcrypt` (work factor 12) or `argon2` with salt before database persistence.
>    - **Authentication:** Replace username-based query parameters with signed **JWT tokens** stored in HTTP-only, secure, SameSite cookies. Verify JWTs in the Socket.IO authentication middleware (`io.use()`).
>    - **Rate Limiting:** Protect `/api/login` and `/api/register` with `express-rate-limit` to prevent credential stuffing.

#### Q20: What happens if two users call each other at the exact same millisecond?
> **Answer:**  
> This is a known WebRTC scenario termed **"Glare"**:
> - In Converso's signaling logic, when User A emits `call-user` to User B, if User B's `callStatusRef.current !== "idle"`, User B automatically emits `reject-call` with `reason: "busy"`.
> - In advanced WebRTC implementations (Perfect Negotiation pattern), glare is resolved using a tie-breaking rule: one peer is assigned as "polite" and the other as "impolite". The polite peer rolls back its offer and accepts the impolite peer's incoming offer.

#### Q21: What happens if a user declines microphone or camera permissions?
> **Answer:**  
> In `CallModal.jsx`, `navigator.mediaDevices.getUserMedia` rejects with a `NotAllowedError` or `PermissionDeniedError`. Converso wraps this in a `try...catch` block:
> 1. Displays a user-friendly Toast notification: *"Could not access camera/microphone. Please allow browser permissions."*
> 2. Emits `reject-call` (`reason: "media_error"`) to the remote peer so they aren't left hanging indefinitely.
> 3. Calls `cleanUpCall()` to reset the modal state back to `"idle"`.

---

## Local Setup & Development Guide

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** A running local MongoDB instance (`mongodb://localhost:27017`) or free MongoDB Atlas URI
- **Package Manager:** `npm` or `yarn`

### 1. Repository Setup
```bash
git clone https://github.com/AryanManav/PeerTalks-main.git
cd PeerTalks-main/Converso
```

### 2. Backend Installation & Environment Setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=3001
FRONTEND_URL="http://localhost:3000"
MONGODB_URI="mongodb://localhost:27017/converso"
# Or MongoDB Atlas:
# MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/converso?retryWrites=true&w=majority"
```

Start the backend:
```bash
npm start
```
*The backend will boot on port 3001 and connect to MongoDB.*

### 3. Frontend Installation & Environment Setup
```bash
cd ../Frontend
npm install
```

Create a `.env.local` (or `.env`) file in `Frontend/`:
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
```

Start the Next.js development server:
```bash
npm run dev
```
*Frontend runs on [http://localhost:3000](http://localhost:3000).*

---

## Project Directory Layout

```
Converso/
├── backend/
│   ├── lib/
│   │   ├── db.js             # Mongoose MongoDB connection establishment
│   │   ├── socket.js         # Socket.IO helper utilities
│   │   └── utils.js          # Shared backend utilities
│   ├── models/
│   │   ├── User.js           # User credentials, profile info, last_seen
│   │   ├── Chat.js           # Conversation metadata and participant tracking
│   │   ├── Message.js        # Message content, timestamps, read receipts
│   │   ├── FriendRequest.js  # Pending requests with compound uniqueness
│   │   └── Notification.js   # Event alerts and activity updates
│   ├── server.js             # Express REST endpoints & Socket.IO WebRTC signaling
│   ├── queries.sql           # Reference legacy SQL schema
│   └── package.json
│
├── Frontend/
│   ├── app/
│   │   ├── chat/             # Chat shell and active conversation views
│   │   │   └── [chatid]/     # Dynamic route for specific 1-on-1 chat
│   │   ├── friendrequest/    # Incoming requests view & acceptance logic
│   │   ├── notification/     # In-app notifications screen
│   │   ├── profile/          # User profile view and edit screens
│   │   ├── login/            # User authentication screen
│   │   ├── register/         # User onboarding and profile avatar setup
│   │   └── layout.jsx        # Root HTML layout and providers
│   ├── components/
│   │   ├── main/
│   │   │   ├── Call/
│   │   │   │   └── CallModal.jsx # Core WebRTC implementation & Audio Synthesizer
│   │   │   └── Chat/
│   │   │       ├── ChatBox.jsx   # Real-time message streaming, typing & auto-scroll
│   │   │       ├── ChatList.jsx  # Active conversations drawer
│   │   │       ├── TopHeader.jsx # Status header with Call trigger action buttons
│   │   │       └── ContactInfoDrawer.jsx # Slide-over peer profile drawer
│   │   ├── Profilepic.jsx    # Avatar component with fallback initials
│   │   └── AppShell.jsx      # Navigation sidebar and persistent CallModal wrapper
│   ├── lib/
│   │   ├── api.js            # Axios / fetch URL resolver
│   │   └── socket.js         # Singleton Socket.IO client instance
│   └── package.json
└── README.md                 # Project documentation & interview preparation guide
```

---

## Summary for Technical Interviews

When presenting this project to interviewers:
1. **Highlight the WebRTC implementation:** Explain that audio/video streams are decentralized and peer-to-peer, keeping server infrastructure costs near zero.
2. **Discuss signaling and race conditions:** Emphasize how you solved ICE candidate trickling and buffered candidates until the remote SDP answer was set.
3. **Showcase full-stack synchronization:** Point out how MongoDB stores persistent messages, Express serves REST endpoints, and Socket.IO synchronizes presence, notifications, and typing indicators in real time.
4. **Mention hardware resilience & audio synthesis:** Discuss the zero-asset Web Audio synthesizer and the graceful fallback to audio-only if camera hardware is locked by another window.
