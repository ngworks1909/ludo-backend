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
    getGameId() {
        return this.gameId;
    }
    getPlayers() {
        return [...this.players];
    }
    getCurrentTurn() {
        return this.currentTurn;
    }
    getWinner() {
        return this.winner;
    }
    joinGame(player) {
        if (this.players.length < this.requiredPlayers) {
            this.players.push(player);
            return true;
        }
        return false;
    }
    isReadyToStart() {
        return this.players.length === this.requiredPlayers;
    }
    startGame() {
        if (this.players.length === this.requiredPlayers) {
            // Emit 'gameStarted' event to all players
            this.players.forEach(player => {
                player.getSocket().emit('gameStarted', {
                    gameId: this.gameId,
                    players: this.players.map(p => p.getUserId()), // You can send any relevant game info here
                    investmentAmount: this.investmentAmount
                });
            });
            // Set the first player's turn
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
        else {
            currentPlayer.getSocket().emit('invalidMove');
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
