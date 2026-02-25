const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static('public'));

let users = {}; // socket.id → { username, room }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ username, room }) => {
    socket.join(room);

    users[socket.id] = { username, room };

    // 방에만 join 메시지
    socket.to(room).emit('chat message', `${username} joined ${room}`);

    // 방에 있는 유저 리스트 보내기
    const roomUsers = Object.values(users)
      .filter(user => user.room === room)
      .map(user => user.username);

    io.to(room).emit('userList', roomUsers);
  });

  socket.on('chat message', (msg) => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('chat message', `${user.username}: ${msg}`);
    }
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user) {
      io.to(user.room).emit('chat message', `${user.username} left the room`);

      delete users[socket.id];

      const roomUsers = Object.values(users)
        .filter(u => u.room === user.room)
        .map(u => u.username);

      io.to(user.room).emit('userList', roomUsers);
    }
  });
});

server.listen(5001, () => {
  console.log('🚀 Server running on http://localhost:5001');
});