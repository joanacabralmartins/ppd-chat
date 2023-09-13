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

io.on('connection', (socket) => {
    console.log("Conexão detectada..."); // Exibe uma mensagem no servidor quando um cliente se conecta via WebSocket

    socket.on('join-request', (username) => {
        socket.username = username; // Define o nome de usuário para o socket
        connectedUsers.push(username); // Adiciona o nome de usuário à lista de usuários conectados
        console.log(connectedUsers); // Exibe a lista de usuários conectados no servidor

        socket.emit('user-ok', connectedUsers); // Envia a lista de usuários conectados para o cliente
        socket.broadcast.emit('list-update', {
            joined: username,
            list: connectedUsers
        }); // Envia uma mensagem para todos os outros clientes informando que um novo usuário se juntou à sala
    });

    socket.on('disconnect', () => {
        connectedUsers = connectedUsers.filter(u => u != socket.username); // Remove o usuário desconectado da lista de usuários conectados
        console.log(connectedUsers); // Exibe a lista atualizada de usuários conectados no servidor

        socket.broadcast.emit('list-update', {
            left: socket.username,
            list: connectedUsers
        }); // Informa aos outros clientes que um usuário desconectou
    });

    socket.on('send-msg', (txt) => {
        let obj = {
            username: socket.username,
            message: txt
        };

        socket.broadcast.emit('show-msg', obj); // Envia a mensagem para todos os outros clientes, exceto o remetente
    });
});