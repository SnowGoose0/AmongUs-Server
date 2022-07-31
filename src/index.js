const fs = require('fs');
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

    socket.emit('get-self', sessionID);

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
        io.emit('nearby-users', connectedUsersData[userIP]);
    });

    socket.on('offer-connection', (payload) => {
        console.log('offer received, sending to ' + `${payload.callee}`)
        io.to(payload.callee).emit('offer-connection', payload);
    });

    socket.on('answer-connection', (payload) => {
        io.to(payload.callee).emit('answer-connection', payload);
    });

    socket.on('ice-candidate', (incoming) => {
        console.log('ice to ', incoming.callee)
        console.log(incoming.candidate)
        io.to(incoming.callee).emit('ice-candidate', incoming.candidate); 
    });

    socket.on('close-channel', (incoming) => {
        io.to(incoming.callee).emit('close-channel')
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
        io.emit('nearby-users', connectedUsersData[userIP]);
    });
});


http.listen(PORT, () => {
    console.log(`SERVER LISTENING ON PORT: ${PORT}`);
});