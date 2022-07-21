const express = require('express');
const app = express();

const http = require('http').createServer(app);

const PORT = process.env.PORT || 8080;

const connectedUsersData = {};

const io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

io.on('connection', (socket) => {

    const sessionID = socket.id;
    let userIP = -999;

    socket.on('connect-ip', (data) => {
        data.id = sessionID;
        userIP = data.ip;

        const currentUser = data;

        if (userIP in connectedUsersData) {
            connectedUsersData[userIP].push(currentUser);
        } else {
            connectedUsersData[userIP] = [currentUser];
        }
        console.log(connectedUsersData)
        socket.emit('nearby-users', connectedUsersData[userIP]);
    })

    socket.on('disconnect', () => {
        if (Object.keys(connectedUsersData).length === 0) {
            return
        } else {
            connectedUsersData[userIP] = connectedUsersData[userIP].filter((user) => {
                return user.id != sessionID;
            })
        }

        console.log(connectedUsersData)
        socket.emit('nearby-users', connectedUsersData[userIP]);
    })
});


http.listen(PORT, () => {
    console.log(`SERVER LISTENING ON PORT: ${PORT}`);
});