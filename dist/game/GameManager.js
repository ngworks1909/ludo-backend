"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Player_1 = require("./Player");
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = new Map();
        this.twoPlayerQueue = new Map();
        this.fourPlayerQueue = new Map();
        this.users = new Map();
    }
    // Add a new user
    addUser(userId, socket) {
        this.users.set(userId, socket);
    }
    // Remove a user
    removeUser(userId) {
        this.users.delete(userId);
    }
    // Join game method to handle player joining
    joinGame(userId, socket, gameType, investmentAmount) {
        const player = new Player_1.Player(userId, socket);
        // Validate investment amount
        if (![50, 100, 200].includes(investmentAmount)) {
            throw new Error("Invalid investment amount");
        }
        if (gameType === "2") {
            // Handle 2-player game logic
            if (!this.twoPlayerQueue.has(investmentAmount)) {
                this.twoPlayerQueue.set(investmentAmount, []);
            }
            const queue = this.twoPlayerQueue.get(investmentAmount);
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
            }
            else {
                const newGameId = `2p-${Date.now()}`; // Generate a unique game ID
                const newGame = new Game_1.Game(newGameId, 2, investmentAmount); // Create a new 2-player game
                newGame.joinGame(player);
                this.games.set(newGameId, newGame);
                queue.push(newGameId); // Add to the queue
            }
        }
        else if (gameType === "4") {
            // Handle 4-player game logic
            if (!this.fourPlayerQueue.has(investmentAmount)) {
                this.fourPlayerQueue.set(investmentAmount, []);
            }
            const queue = this.fourPlayerQueue.get(investmentAmount);
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
            }
            else {
                const newGameId = `4p-${Date.now()}`; // Generate a unique game ID
                const newGame = new Game_1.Game(newGameId, 4, investmentAmount); // Create a new 4-player game
                newGame.joinGame(player);
                this.games.set(newGameId, newGame);
                queue.push(newGameId); // Add to the queue
            }
        }
    }
}
exports.GameManager = GameManager;
