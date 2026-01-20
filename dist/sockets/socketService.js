"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const userManagement_1 = require("./userManagement");
class SocketService {
    constructor() {
        this.io = null;
    }
    initialize(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: '*', // Allow all origins
            }
        });
        console.log('Socket initialized');
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.id}`);
            socket.on('join', (userId) => {
                (0, userManagement_1.addUser)(userId, socket.id);
            });
            socket.on('logout', () => {
                (0, userManagement_1.removeUserBySocketId)(socket.id);
            });
            socket.on('disconnect', () => {
                (0, userManagement_1.removeUserBySocketId)(socket.id);
            });
        });
    }
    getIO() {
        if (!this.io) {
            throw new Error('Socket.io is not initialized');
        }
        return this.io;
    }
}
exports.socketService = new SocketService();
