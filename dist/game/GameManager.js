"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
class GameManager {
    constructor() {
        this.games = [];
        this.users = [];
    }
    addUser(socket) {
        this.users.push(socket);
    }
    removeUser(socket) {
        this.users = this.users.filter(user => user !== socket);
    }
}
exports.GameManager = GameManager;
