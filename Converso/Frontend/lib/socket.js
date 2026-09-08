import { io } from "socket.io-client";

function getSocketUrl() {
  if (typeof window !== "undefined" && window.location.hostname) {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${window.location.hostname}:3001`;
  }
  if (process.env.NEXT_PUBLIC_SOCKET_URL) return process.env.NEXT_PUBLIC_SOCKET_URL;
  if (process.env.NEXT_PUBLIC_BACKEND_URL) return process.env.NEXT_PUBLIC_BACKEND_URL;
  return "http://localhost:3001";
}

let socketInstance = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (!socketInstance) {
    socketInstance = io(getSocketUrl(), {
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

