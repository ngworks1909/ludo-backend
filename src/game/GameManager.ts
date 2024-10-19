import { Player } from "./Player";
import { Game } from "./Game";
import { Socket } from "socket.io";

export class GameManager {
    private games: Map<string, Game>; // Map to track games by gameId
    private twoPlayerQueue: Map<number, string[]>; // Queue for 2-player games by investment
    private fourPlayerQueue: Map<number, string[]>; // Queue for 4-player games by investment
    private users: Map<string, Socket>; // Map to track online users

    constructor() {
        this.games = new Map();
        this.twoPlayerQueue = new Map();
        this.fourPlayerQueue = new Map();
        this.users = new Map();
    }

    // Add a new user
    public addUser(userId: string, socket: Socket) {
        this.users.set(userId, socket);
    }

    // Remove a user
    public removeUser(userId: string) {
        this.users.delete(userId);
    }

    // Join game method to handle player joining
    public joinGame(userId: string, socket: Socket, gameType: string, investmentAmount: number) {
        const player = new Player(userId, socket);

        // Validate investment amount
        if (![50, 100, 200].includes(investmentAmount)) {
            throw new Error("Invalid investment amount");
        }

        if (gameType === "2") {
            // Handle 2-player game logic
            if (!this.twoPlayerQueue.has(investmentAmount)) {
                this.twoPlayerQueue.set(investmentAmount, []);
            }
            const queue = this.twoPlayerQueue.get(investmentAmount)!;

            if (queue.length > 0) {
                const gameId = queue.shift(); // Get the first game ID
                if (gameId !== undefined) { // Ensure gameId is defined
                    const game = this.games.get(gameId);
                    if (game) {
                        game.joinGame(player); // Add player to existing game
                        if (game.isReadyToStart()) {
                            game.startGame(); // Start the game if ready
                        }
                    }
                }
            } else {
                const newGameId = `2p-${Date.now()}`; // Generate a unique game ID
                const newGame = new Game(newGameId, 2, investmentAmount); // Create a new 2-player game
                newGame.joinGame(player);
                this.games.set(newGameId, newGame);
                queue.push(newGameId); // Add to the queue
            }
        } else if (gameType === "4") {
            // Handle 4-player game logic
            if (!this.fourPlayerQueue.has(investmentAmount)) {
                this.fourPlayerQueue.set(investmentAmount, []);
            }
            const queue = this.fourPlayerQueue.get(investmentAmount)!;

            if (queue.length > 0) {
                const gameId = queue.shift(); // Get the first game ID
                if (gameId !== undefined) { // Ensure gameId is defined
                    const game = this.games.get(gameId);
                    if (game) {
                        game.joinGame(player); // Add player to existing game
                        if (game.isReadyToStart()) {
                            game.startGame(); // Start the game if ready
                        }
                    }
                }
            } else {
                const newGameId = `4p-${Date.now()}`; // Generate a unique game ID
                const newGame = new Game(newGameId, 4, investmentAmount); // Create a new 4-player game
                newGame.joinGame(player);
                this.games.set(newGameId, newGame);
                queue.push(newGameId); // Add to the queue
            }
        }
    }
}
