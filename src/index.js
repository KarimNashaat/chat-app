const express = require('express')
const path = require('path')
const socketio = require('socket.io')
const http = require('http')
const Filter = require('bad-words')
const {generateMessage} = require('./utils/message')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

io.on("connection", (socket) => {
  // socket.broadcast.emit("message", generateMessage("User Joined"))

    socket.on("join", (options, callback) => {
        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }

        socket.join(user.room)
        
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined the Chat Room`, "Admin"))        
        socket.emit("message", generateMessage("Welcome to our Chat App", "Admin"))
        
        io.to(user.room).emit('onlineList', ({
            users: getUsersInRoom(user.room),
            room: user.room
        }))
        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        if(!filter.isProfane(message)){
            const user = getUser(socket.id)

            if(user){
                io.to(user.room).emit('message', generateMessage(message, user.username))
                callback()
            }
        }
        else {
            callback("No Profane Words")
        }

    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit("message", generateMessage(`${user.username} has left`, "Admin"))
            
            io.to(user.room).emit('onlineList', ({
                users: getUsersInRoom(user.room),
                room: user.room
            }))

        }
    })

    socket.on("sendLocation", ({latitude, longitude}, callback) => {
        const user = getUser(socket.id)

        if(user){
            io.to(user.room).emit("locationMessage", generateMessage(`https://google.com/maps?q=${latitude},${longitude}`, user.username))
            callback()
        }
    })
})

server.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
