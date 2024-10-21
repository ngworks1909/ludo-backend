import { Player } from './Player';

export class Game {
    private gameId: string;
    private players: Player[];
    private currentTurn: number;
    private winner: Player | null;
    private requiredPlayers: number;
    private totalAmount: number;
    private investmentAmount: number;
    private tax = 0.05;

    constructor(gameId: string, requiredPlayers: number, investmentAmount: number) {
        this.gameId = gameId;
        this.players = [];
        this.currentTurn = 0;
        this.winner = null;
        this.requiredPlayers = requiredPlayers;
        this.investmentAmount = investmentAmount;
        this.totalAmount = (requiredPlayers * investmentAmount) - (requiredPlayers * investmentAmount * this.tax);
    }

    public getGameId(): string {
        return this.gameId;
    }

    public getPlayers(): Player[] {
        return [...this.players];
    }

    public getCurrentTurn(): number {
        return this.currentTurn;
    }

    public getWinner(): Player | null {
        return this.winner;
    }

    public joinGame(player: Player): boolean {
        if (this.players.length < this.requiredPlayers) {
            this.players.push(player);
            return true;
        }
        return false;
    }

    public isReadyToStart(): boolean {
        return this.players.length === this.requiredPlayers;
    }
    

    public startGame(): void {
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
    

    public playTurn(pieceIndex: number, score: number): void {
        const currentPlayer = this.players[this.currentTurn];
        const moveSuccessful = currentPlayer.movePiece(pieceIndex, score);

        if (moveSuccessful) {
            // Check if the move results in a kill
            this.checkForKill(currentPlayer, pieceIndex);

            // Check if current player won
            if (currentPlayer.hasWon()) {
                this.winner = currentPlayer;
                this.endGame();
            } else {
                this.nextTurn();
            }
        }
        else{
            currentPlayer.getSocket().emit('invalidMove')
        }
    }

    private checkForKill(currentPlayer: Player, pieceIndex: number): void {
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

    private nextTurn(): void {
        this.currentTurn = (this.currentTurn + 1) % this.players.length;
        this.players[this.currentTurn].getSocket().emit('yourTurn');
    }

    private endGame(): void {
        this.players.forEach(player => {
            player.getSocket().emit('gameOver', this.winner);
        });
    }
}
