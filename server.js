const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

let rooms = {};
let userRooms = {};

io.on("connection", (socket) => {

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    userRooms[socket.id] = room;

    if (!rooms[room]) rooms[room] = [];

    socket.emit("roomMessages", rooms[room]);
    io.emit("updateRoomList", Object.keys(rooms));
  });

  socket.on("sendMessage", (data) => {
    const room = userRooms[socket.id];
    if (!room) return;

    const msgObj = {
      id: Date.now(),
      user: socket.username,
      text: data.text || null,
      image: data.image || null,
      time: new Date().toLocaleTimeString()
    };

    rooms[room].push(msgObj);

    io.to(room).emit("receiveMessage", msgObj);
    io.to(room).emit("updateHistory", rooms[room]);
  });

  socket.on("deleteMessage", (id) => {
    const room = userRooms[socket.id];
    if (!room) return;

    rooms[room] = rooms[room].filter(m => m.id !== id);

    io.to(room).emit("messageDeleted", id);
    io.to(room).emit("updateHistory", rooms[room]);
  });

  socket.on("clearHistory", () => {
    const room = userRooms[socket.id];
    if (!room) return;

    rooms[room] = [];
    io.to(room).emit("historyCleared");
  });

  socket.on("disconnect", () => {
    delete userRooms[socket.id];
  });

});

server.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
}); 