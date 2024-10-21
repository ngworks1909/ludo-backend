"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Player = void 0;
class Player {
    constructor(userId, socket) {
        this.userId = userId;
        this.socket = socket;
        this.pieces = [-1, -1, -1, -1]; // All pieces start at -1 (home)
    }
    getUserId() {
        return this.userId;
    }
    getSocket() {
        return this.socket;
    }
    getPieces() {
        return [...this.pieces];
    }
    movePiece(pieceIndex, score) {
        if (pieceIndex < 0 || pieceIndex >= this.pieces.length) {
            return false;
        }
        const currentPosition = this.pieces[pieceIndex];
        if (currentPosition === -1 && score === 6) {
            this.pieces[pieceIndex] = 0; // Move to start
            return true;
        }
        // Moving the piece on the board
        else if (currentPosition >= 0 && currentPosition < 57) {
            const newPosition = currentPosition + score;
            if (newPosition <= 57) {
                this.pieces[pieceIndex] = newPosition;
                return true;
            }
        }
        return false;
    }
    kill(pieceIndex) {
        if (pieceIndex < 0 || pieceIndex >= this.pieces.length) {
            return;
        }
        this.pieces[pieceIndex] = -1;
    }
    hasWon() {
        return this.pieces.every(piece => piece === 57);
    }
    getPiecePosition(pieceIndex) {
        return this.pieces[pieceIndex];
    }
}
exports.Player = Player;
