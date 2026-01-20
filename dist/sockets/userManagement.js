"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOnlineUsers = exports.removeUserBySocketId = exports.addUser = void 0;
const onlineUsers = new Map();
const addUser = (userId, socketId) => {
    onlineUsers.set(userId, socketId);
    console.log(`User added: ${userId} with socket ID ${socketId}`);
};
exports.addUser = addUser;
const removeUserBySocketId = (socketId) => {
    for (const [userId, id] of onlineUsers) {
        if (id === socketId) {
            onlineUsers.delete(userId);
            console.log(`User removed: ${userId}`);
            break;
        }
    }
};
exports.removeUserBySocketId = removeUserBySocketId;
const getOnlineUsers = () => {
    return Array.from(onlineUsers.entries());
};
exports.getOnlineUsers = getOnlineUsers;
