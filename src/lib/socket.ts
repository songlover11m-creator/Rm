import { io } from "socket.io-client";

// The socket connection will automatically connect to the same host that serves the page
export const socket = io({
  autoConnect: false,
});
