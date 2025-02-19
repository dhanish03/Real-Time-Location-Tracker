const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const socketio = require('socket.io');

const server = http.createServer(app);
const io = socketio(server);

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

let activeUsers = 0;

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);
    activeUsers++;
    io.emit("user-count", activeUsers);

    socket.on("send-location", (data) => {
        io.emit("receive-location", {
            id: socket.id,
            ...data,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on("send-battery", (data) => {
        io.emit("receive-battery", { id: socket.id, battery: data });
    });

    socket.on("disconnect", () => {
        activeUsers--;
        io.emit("user-disconnected", socket.id);
        io.emit("user-count", activeUsers);
        console.log(`User Disconnected: ${socket.id}`);
    });
});

app.get('/', (req, res) => {
    res.render("index");
});

server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
