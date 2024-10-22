
import prisma from "../lib/auth";
import { Socket } from "socket.io";
import { io } from "../index";
import { createId } from '@paralleldrive/cuid2';

interface Room {
    roomId: string,
    gameId: string,
    players: Player[],
}
interface Player {
    userId: string;
    socketId: string;
}

interface QueueEntry {
    userId: string;
    socketId: string;
}


export class GameManager {
    private onlineUsers: Map<string, string>
    private joinQueue: Map<string, QueueEntry[]>;
    private runningGames: Map<string, Room[]>

    constructor(){
        this.onlineUsers = new Map();
        this.joinQueue = new Map();
        this.runningGames = new Map();
    }

    public async joinGame(socket: Socket, gameId: string){
        try {
            const userId = this.onlineUsers.get(socket.id);
            if(!userId){
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
        } catch (error) {
            socket.emit('error', { message: 'An error occurred while joining the game.' });
        }
    }


    private addToQueue(gameId: string, socketId: string, userId: string) {
        const queue = this.joinQueue.get(gameId) || [];
        queue.push({ socketId, userId });
        this.joinQueue.set(gameId, queue);
    }

    private async processJoinQueue(gameId: string){
        const queue = this.joinQueue.get(gameId) || [];
        const gameDetails = await this.getGameDetails(gameId)
        if(!gameDetails){
            return;
        }
        if(queue.length >= gameDetails.maxPlayers){
            const roomId = createId();
            const room = {
                gameId,
                roomId,
                players: queue.slice(0, gameDetails.maxPlayers),
            }
            const roomCreated = await this.createRoomInDB(room);
            if(!roomCreated){
                io.in(room.roomId).emit('roomCreationError', { message: 'Error creating room.' });
                return;
            }
            const runningRooms = this.runningGames.get(gameId) || [];
            runningRooms.push(room);
            this.runningGames.set(gameId, runningRooms);
            io.in(room.roomId).emit('gameStarted', { gameId, players: room.players });
            queue.splice(0, gameDetails.maxPlayers);
            this.joinQueue.set(gameId, queue);
        }
    }


    public async getMaxPlayers(gameId: string){
        const game = await prisma.game.findUnique({
            where: {
                gameId
            },
            select:{
                maxPlayers: true
            }
        });
        return game?.maxPlayers;
    }

    public async createRoomInDB(room: Room){
        const roomCreated = await prisma.room.create({
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
        return !!roomCreated
    }

    private async getGameDetails(gameId: string){
        const game = await prisma.game.findUnique({
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
    }


    public addUser(socketId: string, userId: string){
        this.onlineUsers.set(socketId, userId)
    }

    public removeUser(socketId: string){
        this.onlineUsers.delete(socketId)
    }


}