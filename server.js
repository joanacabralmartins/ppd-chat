const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');

const app = express(); // Cria uma instância do Express.js
const server = http.createServer(app); // Cria um servidor HTTP usando o Express.js
const io = socketIO(server); // Cria uma instância do Socket.io vinculada ao servidor HTTP

server.listen(3000); // O servidor está ouvindo na porta 3000

app.use(express.static(path.join(__dirname, 'public'))); // Serve arquivos estáticos a partir do diretório 'public'

let connectedUsers = []; // Inicializa um array vazio para rastrear os usuários conectados
let rooms = {}; // Inicializa um objeto vazio para rastrear os usuários e suas salas

io.on('connection', (socket) => {
    console.log("Conexão detectada..."); // Exibe uma mensagem no servidor quando um cliente se conecta via WebSocket

    socket.on('join-request', (username, selectedRoom) => {
        socket.username = username; // Define o nome de usuário para o socket
        socket.room = selectedRoom;
        socket.join(selectedRoom);  // Define a sala para o socket

        connectedUsers.push(username); // Adiciona o nome de usuário à lista de usuários conectados

        rooms[selectedRoom] = rooms[selectedRoom] || []; // Inicializa a sala se ainda não existir
        rooms[selectedRoom].push(username); // Adiciona o usuário à sala

        console.log(connectedUsers); // Exibe a lista de usuários conectados no servidor
        console.log(rooms); // Exibe a lista de salas e seus usuários no servidor

        socket.emit('user-ok', connectedUsers, selectedRoom); // Envia a lista de usuários conectados e a sala escolhida para o cliente
        socket.to(selectedRoom).broadcast.emit('list-update', {
            joined: username,
            room: selectedRoom,
            list: rooms[selectedRoom]
        }); 
    });

    socket.on('disconnect', () => {
        if (socket.room && rooms[socket.room]) {
            rooms[socket.room] = rooms[socket.room].filter(u => u != socket.username); // Remove o usuário desconectado da sala
            console.log(rooms); // Exibe a lista de salas e seus usuários atualizada no servidor
            socket.to(socket.room).broadcast.emit('list-update', {
                left: socket.username,
                room: socket.room,
                list: rooms[socket.room]
            }); // Informa aos outros clientes da sala que um usuário desconectou
        }

        connectedUsers = connectedUsers.filter(u => u != socket.username); // Remove o usuário desconectado da lista de usuários conectados
        console.log(connectedUsers); // Exibe a lista atualizada de usuários conectados no servidor
    });

    socket.on('send-msg', (txt) => {
        let obj = {
            username: socket.username,
            message: txt
        };

        socket.broadcast.to(socket.room).emit('show-msg', obj); // Envia a mensagem para todos os outros clientes, exceto o remetente
    });
});