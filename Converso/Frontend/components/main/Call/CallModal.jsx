"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Profilepic from "@/components/Profilepic";
import socket from "@/lib/socket";
import {
  HiPhone,
  HiPhoneXMark,
  HiOutlineMicrophone,
  HiMiniSpeakerXMark,
  HiOutlineVideoCamera,
  HiOutlineVideoCameraSlash,
  HiOutlineArrowsPointingOut,
  HiOutlineArrowsPointingIn,
  HiExclamationCircle,
} from "react-icons/hi2";
import { toast } from "react-toastify";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

// ==========================================
// Web Audio Synthesizer Chimes & Ringtones
// ==========================================
let audioCtx = null;
let activeRingInterval = null;

const getAudioContext = () => {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
};

const stopAllSounds = () => {
  if (activeRingInterval) {
    clearInterval(activeRingInterval);
    activeRingInterval = null;
  }
};

const playOutgoingTone = () => {
  stopAllSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const ringBeep = () => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (_) {}
  };

  ringBeep();
  activeRingInterval = setInterval(ringBeep, 3000);
};

const playIncomingRing = () => {
  stopAllSounds();
  const ctx = getAudioContext();
  if (!ctx) return;

  const doubleBeep = () => {
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.setValueAtTime(659.25, now + 0.4);
      gain2.gain.setValueAtTime(0.12, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.4);
      osc2.stop(now + 0.75);
    } catch (_) {}
  };

  doubleBeep();
  activeRingInterval = setInterval(doubleBeep, 2500);
};

const playConnectChime = () => {
  stopAllSounds();
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.1, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  } catch (_) {}
};

const playEndChime = () => {
  stopAllSounds();
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [659.25, 440].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.1, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.3);
    });
  } catch (_) {}
};

export default function CallModal() {
  // Call State
  const [callStatus, setCallStatus] = useState("idle"); // 'idle' | 'outgoing' | 'incoming' | 'connected'
  const [statusNotice, setStatusNotice] = useState("");
  const [callType, setCallType] = useState("video"); // 'video' | 'audio'
  const [otherPeer, setOtherPeer] = useState({
    username: "",
    name: "",
    gender: "",
    profilePic: "",
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mutable refs to prevent stale closures and re-binding loops
  const callStatusRef = useRef(callStatus);
  callStatusRef.current = callStatus;

  const callTypeRef = useRef(callType);
  callTypeRef.current = callType;

  const otherPeerRef = useRef(otherPeer);
  otherPeerRef.current = otherPeer;

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const dismissTimeoutRef = useRef(null);
  const pendingIceCandidatesRef = useRef([]);

  // Cleanup helper
  const cleanUpCall = useCallback(() => {
    stopAllSounds();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    pendingIceCandidatesRef.current = [];
    setCallStatus("idle");
    setStatusNotice("");
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoDisabled(false);
    setIsFullscreen(false);
  }, []);

  // Format seconds to mm:ss
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Synchronize stream references into video and audio elements when connected
  useEffect(() => {
    if (callStatus === "connected") {
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      if (remoteVideoRef.current && remoteStreamRef.current) {
        remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      if (remoteAudioRef.current && remoteStreamRef.current) {
        remoteAudioRef.current.srcObject = remoteStreamRef.current;
      }
    }
  }, [callStatus]);

  // Acquire local media with graceful single-PC hardware conflict fallback
  const getLocalMedia = async (type) => {
    try {
      const constraints = {
        audio: true,
        video:
          type === "video"
            ? {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user",
              }
            : false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && type === "video") {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn("Failed to access media devices:", err);

      // Graceful fallback for single-PC testing:
      // On Windows, a physical webcam cannot be opened simultaneously by two tabs/windows.
      // If video access fails due to hardware lock (NotReadableError / TrackStartError),
      // fall back to audio-only stream so the call still establishes successfully!
      if (type === "video" && (err.name === "NotReadableError" || err.name === "TrackStartError")) {
        toast.warn("Camera is in use by another tab. Continuing call with microphone audio!");
        try {
          const fallbackAudio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = fallbackAudio;
          setIsVideoDisabled(true);
          return fallbackAudio;
        } catch (audioErr) {
          console.error("Audio fallback also failed:", audioErr);
        }
      }

      toast.error(
        err.name === "NotReadableError"
          ? "Camera or mic is currently locked by another application/tab."
          : "Could not access camera/microphone. Please allow browser permissions."
      );
      throw err;
    }
  };

  // Initialize WebRTC Peer Connection
  const createPeerConnection = (remoteUsername, stream) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Send ICE candidates to remote peer via socket
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const currentUser = localStorage.getItem("username");
        socket.emit("webrtc-ice-candidate", {
          to: remoteUsername,
          from: currentUser,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote tracks
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    };

    // Add local tracks to peer connection
    const currentStream = stream || localStreamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream);
      });
    }

    return pc;
  };

  // Initiate an Outgoing Call
  const startCall = async (targetUser, type = "video") => {
    const currentUser = localStorage.getItem("username");
    if (!currentUser) return;

    setOtherPeer({
      username: targetUser.username,
      name:
        [targetUser.fname, targetUser.lname].filter(Boolean).join(" ") ||
        targetUser.username,
      gender: targetUser.gender || "Other",
      profilePic: targetUser.profilePic || "",
    });
    setCallType(type);
    setCallStatus("outgoing");
    setStatusNotice("");

    try {
      await getLocalMedia(type);

      if (!socket.connected) socket.connect();
      socket.emit("register-user", currentUser);

      playOutgoingTone();

      socket.emit("call-user", {
        to: targetUser.username,
        from: currentUser,
        callType: type,
      });
    } catch (err) {
      cleanUpCall();
    }
  };

  // Accept Incoming Call
  const handleAcceptCall = async () => {
    const currentUser = localStorage.getItem("username");
    stopAllSounds();

    try {
      const stream = await getLocalMedia(callTypeRef.current);
      createPeerConnection(otherPeerRef.current.username, stream);

      setCallStatus("connected");
      playConnectChime();

      socket.emit("accept-call", {
        to: otherPeerRef.current.username,
        from: currentUser,
      });

      // Start duration counter
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      handleRejectCall("media_error");
    }
  };

  // Reject / Decline Call
  const handleRejectCall = (reason = "declined") => {
    const currentUser = localStorage.getItem("username");
    stopAllSounds();
    socket.emit("reject-call", {
      to: otherPeerRef.current.username,
      from: currentUser,
      reason,
    });
    cleanUpCall();
  };

  // End Ongoing Call
  const handleEndCall = () => {
    const currentUser = localStorage.getItem("username");
    stopAllSounds();
    playEndChime();

    socket.emit("end-call", {
      to: otherPeerRef.current.username,
      from: currentUser,
    });
    toast.info("Call ended");
    cleanUpCall();
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current && callType === "video") {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoDisabled(!videoTrack.enabled);
      }
    }
  };

  // Stable Socket Event Listeners registered once on mount
  useEffect(() => {
    const currentUser = localStorage.getItem("username");
    if (!currentUser) return;

    if (!socket.connected) socket.connect();
    socket.emit("register-user", currentUser);

    // Incoming call listener
    const handleIncomingCall = (data) => {
      if (callStatusRef.current !== "idle") {
        socket.emit("reject-call", {
          to: data.from,
          from: currentUser,
          reason: "busy",
        });
        return;
      }

      setOtherPeer({
        username: data.from,
        name:
          [data.callerDetails?.fname, data.callerDetails?.lname]
            .filter(Boolean)
            .join(" ") || data.from,
        gender: data.callerDetails?.gender || "Other",
        profilePic: data.callerDetails?.profilePic || "",
      });
      setCallType(data.callType || "video");
      setCallStatus("incoming");
      setStatusNotice("");
      playIncomingRing();
    };

    // Caller receives acceptance from Callee -> initiate SDP offer
    const handleCallAccepted = async () => {
      stopAllSounds();
      playConnectChime();
      setCallStatus("connected");

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      try {
        const pc = createPeerConnection(
          otherPeerRef.current.username,
          localStreamRef.current
        );
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("webrtc-offer", {
          to: otherPeerRef.current.username,
          from: currentUser,
          offer,
        });
      } catch (err) {
        console.error("Error creating WebRTC offer:", err);
        cleanUpCall();
      }
    };

    // Callee receives SDP offer -> answer back
    const handleWebRTCOffer = async (data) => {
      try {
        let pc = peerConnectionRef.current;
        if (!pc) {
          pc = createPeerConnection(data.from, localStreamRef.current);
        }

        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

        // Process any queued ICE candidates
        while (pendingIceCandidatesRef.current.length > 0) {
          const candidate = pendingIceCandidatesRef.current.shift();
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Failed to add buffered ICE candidate:", e);
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("webrtc-answer", {
          to: data.from,
          from: currentUser,
          answer,
        });
      } catch (err) {
        console.error("Error handling WebRTC offer:", err);
      }
    };

    // Caller receives SDP answer
    const handleWebRTCAnswer = async (data) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));

          while (pendingIceCandidatesRef.current.length > 0) {
            const candidate = pendingIceCandidatesRef.current.shift();
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Failed to add buffered ICE candidate:", e);
            }
          }
        }
      } catch (err) {
        console.error("Error setting remote answer:", err);
      }
    };

    // Exchange ICE Candidate
    const handleWebRTCIceCandidate = async (data) => {
      try {
        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } else {
          pendingIceCandidatesRef.current.push(data.candidate);
        }
      } catch (err) {
        console.error("Error adding ICE candidate:", err);
      }
    };

    // Call Rejected
    const handleCallRejected = (data) => {
      stopAllSounds();
      playEndChime();
      const message =
        data.reason === "busy"
          ? `@${data.from} is currently on another call`
          : `@${data.from} declined the call`;

      setStatusNotice(message);
      toast.warn(message);

      dismissTimeoutRef.current = setTimeout(() => {
        cleanUpCall();
      }, 1500);
    };

    // Call User Offline
    const handleCallUserOffline = (data) => {
      stopAllSounds();
      playEndChime();
      const message = `@${data.to} is currently offline`;
      setStatusNotice(message);
      toast.error(message);

      dismissTimeoutRef.current = setTimeout(() => {
        cleanUpCall();
      }, 1500);
    };

    // Call Ended by remote peer
    const handleCallEnded = () => {
      stopAllSounds();
      playEndChime();
      toast.info("Call ended by peer");
      cleanUpCall();
    };

    // Attach listeners
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("webrtc-offer", handleWebRTCOffer);
    socket.on("webrtc-answer", handleWebRTCAnswer);
    socket.on("webrtc-ice-candidate", handleWebRTCIceCandidate);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-user-offline", handleCallUserOffline);
    socket.on("call-ended", handleCallEnded);

    // Global custom event to start call from header buttons
    const handleGlobalTriggerCall = (e) => {
      if (e?.detail?.targetUser) {
        startCall(e.detail.targetUser, e.detail.callType || "video");
      }
    };
    window.addEventListener("start-peer-call", handleGlobalTriggerCall);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("webrtc-offer", handleWebRTCOffer);
      socket.off("webrtc-answer", handleWebRTCAnswer);
      socket.off("webrtc-ice-candidate", handleWebRTCIceCandidate);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-user-offline", handleCallUserOffline);
      socket.off("call-ended", handleCallEnded);
      window.removeEventListener("start-peer-call", handleGlobalTriggerCall);
      cleanUpCall();
    };
  }, [cleanUpCall]);

  if (callStatus === "idle") return null;

  return (
    <>
      {/* Hidden audio element for remote audio stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* ==================================================== */}
      {/* 1. INCOMING CALL MODAL                               */}
      {/* ==================================================== */}
      {callStatus === "incoming" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full ring-4 ring-primary-500/30 animate-pulse flex items-center justify-center">
                <Profilepic
                  gender={otherPeer.gender}
                  name={otherPeer.name}
                  profilePic={otherPeer.profilePic}
                  className="w-20 h-20 rounded-full shadow-md"
                />
              </div>
              <span className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary-600 text-white shadow-md">
                {callType === "video" ? (
                  <HiOutlineVideoCamera className="w-4 h-4" />
                ) : (
                  <HiPhone className="w-4 h-4" />
                )}
              </span>
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {otherPeer.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              @{otherPeer.username}
            </p>
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
              Incoming {callType === "video" ? "Video Call..." : "Audio Call..."}
            </p>

            <div className="flex items-center gap-6 mt-8">
              {/* Decline Button */}
              <button
                type="button"
                onClick={() => handleRejectCall("declined")}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90">
                  <HiPhoneXMark className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-medium text-zinc-500">Decline</span>
              </button>

              {/* Accept Button */}
              <button
                type="button"
                onClick={handleAcceptCall}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90 animate-bounce">
                  <HiPhone className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 font-semibold">
                  Accept
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. OUTGOING CALLING MODAL                            */}
      {/* ==================================================== */}
      {callStatus === "outgoing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full ring-4 ring-primary-500/40 animate-pulse flex items-center justify-center">
                <Profilepic
                  gender={otherPeer.gender}
                  name={otherPeer.name}
                  profilePic={otherPeer.profilePic}
                  className="w-20 h-20 rounded-full shadow-md"
                />
              </div>
            </div>

            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {otherPeer.name}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              @{otherPeer.username}
            </p>

            {statusNotice ? (
              <div className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-medium animate-shake">
                <HiExclamationCircle className="w-4 h-4 shrink-0" />
                <span>{statusNotice}</span>
              </div>
            ) : (
              <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-500 animate-ping" />
                Calling {callType === "video" ? "Video..." : "Audio..."}
              </p>
            )}

            <div className="mt-8">
              <button
                type="button"
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
                title="Cancel Call"
              >
                <HiPhoneXMark className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. CONNECTED CALL (AUDIO OR VIDEO)                   */}
      {/* ==================================================== */}
      {callStatus === "connected" && (
        <div
          className={`fixed z-50 transition-all duration-200 flex flex-col bg-zinc-950 text-white ${
            isFullscreen
              ? "inset-0"
              : "bottom-4 right-4 w-96 sm:w-[480px] h-[380px] sm:h-[420px] rounded-3xl shadow-2xl overflow-hidden border border-zinc-800"
          }`}
        >
          {/* Top Bar: Peer Name & Timer */}
          <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Profilepic
                gender={otherPeer.gender}
                name={otherPeer.name}
                profilePic={otherPeer.profilePic}
                className="w-8 h-8 rounded-full ring-2 ring-white/40"
              />
              <div>
                <p className="text-xs font-bold text-white drop-shadow truncate">
                  {otherPeer.name}
                </p>
                <p className="text-[10px] text-emerald-400 font-semibold drop-shadow">
                  {formatTimer(callDuration)}
                </p>
              </div>
            </div>

            {/* Expand / Minimize Window */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white transition-colors"
              title={isFullscreen ? "Minimize window" : "Fullscreen"}
            >
              {isFullscreen ? (
                <HiOutlineArrowsPointingIn className="w-4 h-4" />
              ) : (
                <HiOutlineArrowsPointingOut className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Main Stage View */}
          <div className="relative flex-1 bg-zinc-900 flex items-center justify-center overflow-hidden">
            {callType === "video" ? (
              <>
                {/* Remote Video (Full Stage) */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Self View (Picture-in-Picture) */}
                <div className="absolute bottom-20 right-4 w-28 sm:w-36 h-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-zinc-800 z-10">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${
                      isVideoDisabled ? "hidden" : ""
                    }`}
                  />
                  {isVideoDisabled && (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 text-xs">
                      <HiOutlineVideoCameraSlash className="w-6 h-6 mb-1 text-zinc-500" />
                      <span>Camera Off</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Audio Call View: Pulsing Waveform */
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-primary-600/20 animate-ping absolute inset-0" />
                  <Profilepic
                    gender={otherPeer.gender}
                    name={otherPeer.name}
                    profilePic={otherPeer.profilePic}
                    className="w-32 h-32 rounded-full shadow-2xl ring-4 ring-primary-500/50 relative z-10"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white capitalize">
                    {otherPeer.name}
                  </h3>
                  <p className="text-xs text-zinc-400">Audio call in progress</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Call Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20 flex items-center justify-center gap-4">
            {/* Mute / Unmute Microphone */}
            <button
              type="button"
              onClick={toggleMute}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md ${
                isMuted
                  ? "bg-rose-600 text-white"
                  : "bg-white/20 hover:bg-white/30 backdrop-blur-md text-white"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? (
                <HiMiniSpeakerXMark className="w-5 h-5" />
              ) : (
                <HiOutlineMicrophone className="w-5 h-5" />
              )}
            </button>

            {/* Toggle Camera (If video call) */}
            {callType === "video" && (
              <button
                type="button"
                onClick={toggleVideo}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md ${
                  isVideoDisabled
                    ? "bg-rose-600 text-white"
                    : "bg-white/20 hover:bg-white/30 backdrop-blur-md text-white"
                }`}
                title={isVideoDisabled ? "Turn On Camera" : "Turn Off Camera"}
              >
                {isVideoDisabled ? (
                  <HiOutlineVideoCameraSlash className="w-5 h-5" />
                ) : (
                  <HiOutlineVideoCamera className="w-5 h-5" />
                )}
              </button>
            )}

            {/* End Call Button */}
            <button
              type="button"
              onClick={handleEndCall}
              className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-90"
              title="Hang up call"
            >
              <HiPhoneXMark className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
