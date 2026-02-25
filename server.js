const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

io.on("connection", (socket) => {

  socket.on("joinRoom", (room) => {
    socket.join(room);
    if (!rooms[room]) rooms[room] = [];
    socket.emit("previousMessages", rooms[room]);
  });

  socket.on("chatMessage", ({ room, message }) => {
    const msgObj = {
      id: Date.now().toString(),
      text: message
    };

    rooms[room].push(msgObj);
    io.to(room).emit("message", msgObj);
  });

  socket.on("editMessage", ({ room, id, newText }) => {
    const msg = rooms[room].find(m => m.id === id);
    if (msg) {
      msg.text = newText;
      io.to(room).emit("messageEdited", msg);
    }
  });

  // 🔥 DELETE
  socket.on("deleteMessage", ({ room, id }) => {
    if (!rooms[room]) return;

    rooms[room] = rooms[room].filter(m => m.id !== id);
    io.to(room).emit("messageDeleted", id);
  });

});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});