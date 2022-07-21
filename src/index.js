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

    let userID = socket.id;
    let userIP = -1;

    socket.on('ip', (userData) => {

        userIP = userData.ip
        userData.id = userID;

        if (userIP in connectedUsersData) {
            connectedUsersData[userIP].push(userData);
            console.log('true');
        } else {
            connectedUsersData[userIP] = [userData];
            console.log('false');
        }

        io.emit('receive-nearby-users', connectedUsersData[userIP]);
    })

    socket.on('disconnect', () => {
        connectedUsersData[userIP] = connectedUsersData[userIP].filter((user) => {
            return user.id != userID;
        })

        io.emit('receive-nearby-users', connectedUsersData[userIP]);
    })
});


http.listen(PORT, () => {
    console.log(`SERVER LISTENING ON PORT: ${PORT}`);
});