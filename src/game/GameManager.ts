import { Socket } from "socket.io";
import { Game } from "./Game";

export class GameManager{
    private games: Game[];
    private users: Socket[];

    constructor () {
        this.games = [];
        this.users = [];
    }

    addUser(socket: Socket){
        this.users.push(socket);
    }

    removeUser(socket: Socket){
        this.users = this.users.filter(user => user !==socket)
    }
}