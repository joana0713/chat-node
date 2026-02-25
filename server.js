const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {
  general: [],
  dev: [],
  random: []
};

io.on("connection", (socket) => {

  socket.emit("roomList", Object.keys(rooms));

  socket.on("joinRoom", (room) => {
    socket.join(room);
    socket.currentRoom = room;

    if (!rooms[room]) rooms[room] = [];

    socket.emit("previousMessages", rooms[room]);
  });

  socket.on("chatMessage", ({ text, image }) => {
    const room = socket.currentRoom;
    if (!room) return;

    const msgObj = {
      id: Date.now().toString(),
      text: text || "",
      image: image || null
    };

    rooms[room].push(msgObj);
    io.to(room).emit("message", msgObj);
  });

  socket.on("deleteMessage", (id) => {
    const room = socket.currentRoom;
    if (!room) return;

    rooms[room] = rooms[room].filter(m => m.id !== id);
    io.to(room).emit("messageDeleted", id);
  });

  socket.on("createRoom", (roomName) => {
    if (!rooms[roomName]) {
      rooms[roomName] = [];
      io.emit("roomList", Object.keys(rooms));
    }
  });

});

server.listen(3000, () => {
  console.log("Server running on 3000");
});