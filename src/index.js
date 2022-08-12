const fs = require('fs');
const express = require('express');
const generateName = require('./users');

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
    const imageID = Math.floor(Math.random() * 12) + 1;

    let userIP = -999;

    const avatar = 'data:image/webp;base64,' + fs.readFileSync(`./Icons/${imageID}.webp`, 'base64');

    socket.emit('get-self', sessionID);

    socket.on('connect-ip', (data) => {
        const currentUser = data;
        userIP = currentUser.ip;

        currentUser.id = sessionID;
        currentUser.image = imageID;
        currentUser.image64 = avatar;

        socket.join(`${userIP}`);
        socket.broadcast.to(`${userIP}`).emit('user-joined', sessionID);

        if (userIP in connectedUsersData) {
            currentUser.alias = generateName(connectedUsersData[userIP]);
            connectedUsersData[userIP].push(currentUser);
            
        } else {
            currentUser.alias = generateName([]);
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
        io.to(incoming.callee).emit('ice-candidate', incoming); 
    });

    socket.on('close-channel', (incoming) => {
        io.to(incoming.callee).emit('close-channel', {id: socket.id})
    })

    socket.on('disconnect', () => {
        if (Object.keys(connectedUsersData).length === 0) {
            return
        } else {
            connectedUsersData[userIP] = connectedUsersData[userIP].filter((user) => {
                return user.id != sessionID;
            })
        }

        io.emit('nearby-users', connectedUsersData[userIP]);
    });
});


http.listen(PORT, () => {
    console.log(`SERVER LISTENING ON PORT: ${PORT}`);
});