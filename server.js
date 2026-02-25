const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];

    io.to(room).emit("systemMessage", `${username} joined`);
  });

  socket.on("sendMessage", (message) => {
    const msgObj = {
      id: Date.now(),
      user: socket.username,
      text: message,
      time: new Date().toLocaleTimeString(),
      read: false
    };

    rooms[socket.room].push(msgObj);
    io.to(socket.room).emit("receiveMessage", msgObj);
  });

  socket.on("deleteMessage", (id) => {
    rooms[socket.room] = rooms[socket.room].filter(m => m.id !== id);
    io.to(socket.room).emit("messageDeleted", id);
  });

  socket.on("messageRead", (id) => {
    io.to(socket.room).emit("messageReadUpdate", id);
  });

  socket.on("disconnect", () => {
    if (socket.room) {
      io.to(socket.room).emit("systemMessage", `${socket.username} left`);
    }
  });
});

server.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});