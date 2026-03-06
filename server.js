const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http)
const { v4: uuidv4 } = require("uuid")

app.use(express.static("public"))

let rooms = {}
let users = {}

io.on("connection", (socket) => {

socket.on("createRoom",(room)=>{

if(!rooms[room]){
rooms[room]=[]
users[room]=[]
io.emit("roomList",Object.keys(rooms))
}

})

socket.on("joinRoom",({room,nickname})=>{

socket.join(room)
socket.room=room
socket.nickname=nickname

if(!users[room]) users[room]=[]
users[room].push(nickname)

socket.emit("chatHistory",rooms[room]||[])
io.to(room).emit("userList",users[room])

io.to(room).emit("chatMessage",{
id:uuidv4(),
user:"System",
text:`${nickname} joined`,
system:true,
time:new Date().toLocaleTimeString()
})

})

socket.on("chatMessage",(msg)=>{

if(!socket.room) return

const message={
id:uuidv4(),
user:socket.nickname,
text:msg.text||"",
image:msg.image||null,
time:new Date().toLocaleTimeString()
}

rooms[socket.room].push(message)

io.to(socket.room).emit("chatMessage",message)

})

socket.on("typing",()=>{

socket.to(socket.room).emit("typing",socket.nickname)

})

socket.on("reaction",({id,emoji})=>{

io.to(socket.room).emit("reaction",{id,emoji})

})

socket.on("deleteMessage",(id)=>{

rooms[socket.room]=rooms[socket.room].filter(m=>m.id!==id)

io.to(socket.room).emit("messageDeleted",id)

})

socket.on("disconnect",()=>{

if(socket.room){

users[socket.room]=users[socket.room].filter(u=>u!==socket.nickname)

io.to(socket.room).emit("userList",users[socket.room])

io.to(socket.room).emit("chatMessage",{
id:uuidv4(),
user:"System",
text:`${socket.nickname} left`,
system:true,
time:new Date().toLocaleTimeString()
})

}

})

})

http.listen(3000,()=>{

console.log("http://localhost:3000")

})