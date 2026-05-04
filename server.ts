import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // In-memory store for session persistence
  const messages: any[] = [];
  const users = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", ({ username, password }) => {
      // Simple password check (hardcoded for simplicity as requested "secret group password")
      // In a real app, you might want this to be configurable or stored in env
      const SECRET_PASSWORD = process.env.VITE_GROUP_PASSWORD || "friends123";

      if (password !== SECRET_PASSWORD) {
        socket.emit("error", "Invalid secret password");
        return;
      }

      users.set(socket.id, { username, id: socket.id });
      
      // Join general room
      socket.join("general");

      // Send history
      socket.emit("history", messages.slice(-50));

      // Broadcast join
      io.to("general").emit("userList", Array.from(users.values()));
      io.to("general").emit("message", {
        id: `system-${Date.now()}`,
        username: "System",
        text: `${username} has joined the circle.`,
        timestamp: new Date().toISOString(),
        isSystem: true
      });
    });

    socket.on("sendMessage", (text) => {
      const user = users.get(socket.id);
      if (user) {
        const newMessage = {
          id: `${socket.id}-${Date.now()}`,
          username: user.username,
          text,
          timestamp: new Date().toISOString(),
        };
        messages.push(newMessage);
        if (messages.length > 100) messages.shift(); // Keep last 100
        
        io.to("general").emit("message", newMessage);
      }
    });

    socket.on("typing", (isTyping) => {
      const user = users.get(socket.id);
      if (user) {
        socket.to("general").emit("userTyping", { username: user.username, isTyping });
      }
    });

    socket.on("disconnect", () => {
      const user = users.get(socket.id);
      if (user) {
        io.to("general").emit("message", {
          id: `system-${Date.now()}`,
          username: "System",
          text: `${user.username} has left the circle.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        });
        users.delete(socket.id);
        io.to("general").emit("userList", Array.from(users.values()));
      }
      console.log("User disconnected:", socket.id);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
