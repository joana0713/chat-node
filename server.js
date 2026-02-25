const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const { v4: uuidv4 } = require("uuid");

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("createRoom", (room) => {
    if (!rooms[room]) {
      rooms[room] = [];
      io.emit("roomList", Object.keys(rooms));
    }
  });

  socket.on("joinRoom", ({ room, nickname }) => {
    socket.join(room);
    socket.room = room;
    socket.nickname = nickname;

    socket.emit("chatHistory", rooms[room] || []);

    io.to(room).emit("chatMessage", {
      id: uuidv4(),
      user: "System",
      text: `${nickname} joined the room`,
      system: true,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("chatMessage", (msg) => {
    if (!socket.room) return;

    const message = {
      id: uuidv4(),
      user: socket.nickname,
      text: msg.text || "",
      image: msg.image || null,
      time: new Date().toLocaleTimeString()
    };

    rooms[socket.room].push(message);
    io.to(socket.room).emit("chatMessage", message);
  });

  socket.on("deleteMessage", (id) => {
    if (!socket.room) return;
    rooms[socket.room] = rooms[socket.room].filter(m => m.id !== id);
    io.to(socket.room).emit("messageDeleted", id);
  });

  socket.on("disconnect", () => {
    if (socket.room && socket.nickname) {
      io.to(socket.room).emit("chatMessage", {
        id: uuidv4(),
        user: "System",
        text: `${socket.nickname} left the room`,
        system: true,
        time: new Date().toLocaleTimeString()
      });
    }
  });

});

http.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});