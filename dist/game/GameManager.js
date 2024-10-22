"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const auth_1 = __importDefault(require("../lib/auth"));
const index_1 = require("../index");
const cuid2_1 = require("@paralleldrive/cuid2");
class GameManager {
    constructor() {
        this.onlineUsers = new Map();
        this.joinQueue = new Map();
        this.runningGames = new Map();
    }
    joinGame(socket, gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = this.onlineUsers.get(socket.id);
                if (!userId) {
                    socket.emit('error', { message: 'User not authenticated. Please log in.' });
                    return;
                }
                // const existingRoom = this.joinQueue.get(gameId);
                // if(existingRoom){
                //     existingRoom.push({userId, socketId: socket.id});
                //     socket.join(existingRoom.roomId);
                //     if(existingRoom.players.length === existingRoom.maxPlayers){
                //         this.waitingRooms.delete(gameId);
                //         const roomCreated = await this.createRoomInDB(existingRoom);
                //         if(!roomCreated){
                //             io.in(existingRoom.roomId).emit('roomCreationError', { message: 'Error creating room.' });
                //             return;
                //         }
                //         const runningRooms = this.runningGames.get(gameId) || [];
                //         runningRooms.push(existingRoom);
                //         this.runningGames.set(gameId, runningRooms);
                //         io.in(existingRoom.roomId).emit('gameStarted', { gameId, players: existingRoom.players });
                //     }
                //     else{
                //         io.in(existingRoom.roomId).emit('playerJoined', { gameId, player: {userId, socketId: socket.id} })
                //     }
                // }
                // else{
                //     const maxPlayers = await this.getMaxPlayers(gameId);
                //     if(!maxPlayers){
                //         socket.emit('error', { message: 'Game not found.' });
                //         return;
                //     }
                //     const roomId = createId();
                //     const newRoom = {
                //         gameId,
                //         roomId,
                //         players: [{userId, socketId: socket.id}],
                //         maxPlayers
                //     }
                //     this.waitingRooms.set(gameId, newRoom);
                //     socket.join(roomId);
                //     socket.emit('roomCreated', {message: 'Please wait for other players to join.'});
                // }
            }
            catch (error) {
                socket.emit('error', { message: 'An error occurred while joining the game.' });
            }
        });
    }
    addToQueue(gameId, socketId, userId) {
        const queue = this.joinQueue.get(gameId) || [];
        queue.push({ socketId, userId });
        this.joinQueue.set(gameId, queue);
    }
    processJoinQueue(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            const queue = this.joinQueue.get(gameId) || [];
            const gameDetails = yield this.getGameDetails(gameId);
            if (!gameDetails) {
                return;
            }
            if (queue.length >= gameDetails.maxPlayers) {
                const roomId = (0, cuid2_1.createId)();
                const room = {
                    gameId,
                    roomId,
                    players: queue.slice(0, gameDetails.maxPlayers),
                };
                const roomCreated = yield this.createRoomInDB(room);
                if (!roomCreated) {
                    index_1.io.in(room.roomId).emit('roomCreationError', { message: 'Error creating room.' });
                    return;
                }
                const runningRooms = this.runningGames.get(gameId) || [];
                runningRooms.push(room);
                this.runningGames.set(gameId, runningRooms);
                index_1.io.in(room.roomId).emit('gameStarted', { gameId, players: room.players });
                queue.splice(0, gameDetails.maxPlayers);
                this.joinQueue.set(gameId, queue);
            }
        });
    }
    getMaxPlayers(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = yield auth_1.default.game.findUnique({
                where: {
                    gameId
                },
                select: {
                    maxPlayers: true
                }
            });
            return game === null || game === void 0 ? void 0 : game.maxPlayers;
        });
    }
    createRoomInDB(room) {
        return __awaiter(this, void 0, void 0, function* () {
            const roomCreated = yield auth_1.default.room.create({
                data: {
                    roomId: room.roomId,
                    gameId: room.gameId,
                    players: {
                        createMany: {
                            data: room.players.map(player => ({
                                userId: player.userId
                            }))
                        }
                    }
                }
            });
            return !!roomCreated;
        });
    }
    getGameDetails(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = yield auth_1.default.game.findUnique({
                where: {
                    gameId
                },
                select: {
                    gameId: true,
                    maxPlayers: true,
                    entryFee: true,
                }
            });
            return game;
        });
    }
    addUser(socketId, userId) {
        this.onlineUsers.set(socketId, userId);
    }
    removeUser(socketId) {
        this.onlineUsers.delete(socketId);
    }
}
exports.GameManager = GameManager;
