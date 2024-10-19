"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
class Game {
    constructor(gameId, requiredPlayers, investmentAmount) {
        this.tax = 0.05;
        this.gameId = gameId;
        this.players = [];
        this.currentTurn = 0;
        this.winner = null;
        this.requiredPlayers = requiredPlayers;
        this.investmentAmount = investmentAmount;
        this.totalAmount = (requiredPlayers * investmentAmount) - (requiredPlayers * investmentAmount * this.tax);
    }
    // Getter for gameId
    getGameId() {
        return this.gameId;
    }
    // Getter for players array
    getPlayers() {
        return [...this.players]; // Return a copy to prevent direct manipulation
    }
    // Getter for current turn index
    getCurrentTurn() {
        return this.currentTurn;
    }
    // Getter for winner
    getWinner() {
        return this.winner;
    }
    joinGame(player) {
        if (this.players.length < this.requiredPlayers) {
            this.players.push(player);
            if (this.players.length === this.requiredPlayers) {
                this.startGame();
            }
            return true;
        }
        return false;
    }
    startGame() {
        if (this.players.length === this.requiredPlayers) {
            this.currentTurn = 0;
            this.players[this.currentTurn].getSocket().emit('yourTurn');
        }
    }
    playTurn(pieceIndex, score) {
        const currentPlayer = this.players[this.currentTurn];
        const moveSuccessful = currentPlayer.movePiece(pieceIndex, score);
        if (moveSuccessful) {
            // Check if the move results in a kill
            this.checkForKill(currentPlayer, pieceIndex);
            // Check if current player won
            if (currentPlayer.hasWon()) {
                this.winner = currentPlayer;
                this.endGame();
            }
            else {
                this.nextTurn();
            }
        }
    }
    checkForKill(currentPlayer, pieceIndex) {
        const currentPosition = currentPlayer.getPiecePosition(pieceIndex);
        this.players.forEach(player => {
            if (player !== currentPlayer) {
                player.getPieces().forEach((pos, idx) => {
                    if (pos === currentPosition) {
                        player.kill(idx); // Kill the piece
                    }
                });
            }
        });
    }
    nextTurn() {
        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.players[this.currentTurn].getSocket().emit('yourTurn');
    }
    endGame() {
        this.players.forEach(player => {
            player.getSocket().emit('gameOver', this.winner);
        });
    }
}
exports.Game = Game;
