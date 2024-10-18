"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const adminRoute_1 = __importDefault(require("./routes/adminRoute"));
const contestRoute_1 = __importDefault(require("./routes/contestRoute"));
const userRoute_1 = __importDefault(require("./routes/userRoute"));
const transactionRoute_1 = __importDefault(require("./routes/transactionRoute"));
const bannerRoute_1 = __importDefault(require("./routes/bannerRoute"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use('/uploads', express_1.default.static('uploads'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/admin', adminRoute_1.default);
app.use('/api/contest', contestRoute_1.default);
app.use('/api/user', userRoute_1.default);
app.use('/api/transactions', transactionRoute_1.default);
app.use('/api/banner', bannerRoute_1.default);
app.get("/", (req, res) => {
    res.send("Hello User");
});
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
io.on('connection', (socket) => {
    let token = socket.handshake.query.token;
    if (Array.isArray(token)) {
        token = token[0];
    }
    if (!token) {
        return socket.disconnect(true);
    }
    const data = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
    if (typeof data === 'string') {
        return socket.disconnect(true);
    }
    const userId = data.userId;
    onlineUsers.set(userId, socket.id);
    socket.on('add-twoPlayer', () => {
        if (!onlineUsers.has(userId)) {
            return;
        }
        const targetSocketId = onlineUsers.get(userId);
        if (!targetSocketId) {
            return;
        }
        if (fourPlayers.includes(userId)) {
            io.to(targetSocketId).emit('addTwoPlayerFailed', { message: 'You are already in a four-player game.' });
            return;
        }
        if (twoPlayers.includes(userId)) {
            io.to(targetSocketId).emit('alreadyInTwoPlayers', { message: 'You are already in the two-player game.' });
            return;
        }
        else {
            twoPlayers.push(userId);
            io.to(targetSocketId).emit('addedToTwoPlayers', { message: 'You have been successfully added to the two-player game.' });
        }
    });
    socket.on('add-fourPlayer', () => {
        if (!onlineUsers.has(userId)) {
            return;
        }
        const targetSocketId = onlineUsers.get(userId);
        if (!targetSocketId) {
            return;
        }
        if (twoPlayers.includes(userId)) {
            io.to(targetSocketId).emit('addTwoPlayerFailed', { message: 'You are already in a two-player game.' });
            return;
        }
        if (fourPlayers.includes(userId)) {
            io.to(targetSocketId).emit('alreadyInTwoPlayers', { message: 'You are already in the four-player game.' });
            return;
        }
        else {
            twoPlayers.push(userId);
            io.to(targetSocketId).emit('addedToFourPlayers', { message: 'You have been successfully added to the four-player game.' });
        }
    });
    socket.on('gameEnd', ({ gameId, players, winnerId, gameType }) => {
        //update winner wallet with amount and add into wongames
        //update lost players lost game activity
    });
    socket.on('disconnect', () => {
        onlineUsers.delete(userId);
    });
});
app.listen(process.env.PORT || 3001, () => {
    console.log(`Connected to localhost on port ${process.env.PORT || 3001}`);
});
