import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:3001";

let socketInstance = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
  }
  return socketInstance;
}

const socketProxy = new Proxy({}, {
  get(target, prop) {
    const s = getSocket();
    if (!s) return () => {};
    const val = s[prop];
    if (typeof val === "function") {
      return val.bind(s);
    }
    return val;
  },
  set(target, prop, value) {
    const s = getSocket();
    if (s) s[prop] = value;
    return true;
  }
});

export default socketProxy;

