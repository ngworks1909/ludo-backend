import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import adminRouter from './routes/adminRoute'
import contestRouter from './routes/contestRoute'
import userRouter from './routes/userRoute'
import transactionRouter from './routes/transactionRoute'
import bannerRouter from './routes/bannerRoute'
import { Server } from 'socket.io'
import http from 'http'
import jwt from 'jsonwebtoken'

dotenv.config()

const app = express()
app.use(cors())
app.use('/uploads', express.static('uploads'));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use('/api/admin', adminRouter)
app.use('/api/contest', contestRouter);
app.use('/api/user', userRouter)
app.use('/api/transactions', transactionRouter)
app.use('/api/banner', bannerRouter)

app.get("/",(req,res)=>{
    res.send("Hello User");
})


const server = http.createServer(app);
const io = new Server(server);

declare global{
    var onlineUsers : Map<string, string>;
    var twoPlayers: string[];
    var fourPlayers: string[];

}

io.on('connection', (socket) => {
    let token = socket.handshake.query.token
    if (Array.isArray(token)) {
        token = token[0]; 
    }
    if(!token){
        return socket.disconnect(true)
    }
    const data = jwt.verify(token, process.env.JWT_SECRET || "secret");
    if (typeof data === 'string') {
        return socket.disconnect(true);
    }
    const userId = data.userId;
    onlineUsers.set(userId, socket.id);


    socket.on('add-twoPlayer', ()=> {
        if(!onlineUsers.has(userId)){
            return
        }
        const targetSocketId = onlineUsers.get(userId);
        if(!targetSocketId){
            return
        }
        if(fourPlayers.includes(userId)){
            io.to(targetSocketId).emit('addTwoPlayerFailed', { message: 'You are already in a four-player game.' });
            return
        }
        if (twoPlayers.includes(userId)) {
            io.to(targetSocketId).emit('alreadyInTwoPlayers', { message: 'You are already in the two-player game.' });
            return;
        }
        else{
            twoPlayers.push(userId)
            io.to(targetSocketId).emit('addedToTwoPlayers', { message: 'You have been successfully added to the two-player game.' });
        }
    })

    socket.on('add-fourPlayer', () => {
        if(!onlineUsers.has(userId)){
            return
        }
        const targetSocketId = onlineUsers.get(userId);
        if(!targetSocketId){
            return
        }
        if(twoPlayers.includes(userId)){
            io.to(targetSocketId).emit('addTwoPlayerFailed', { message: 'You are already in a two-player game.' });
            return
        }
        if (fourPlayers.includes(userId)) {
            io.to(targetSocketId).emit('alreadyInTwoPlayers', { message: 'You are already in the four-player game.' });
            return;
        }
        else{
            twoPlayers.push(userId)
            io.to(targetSocketId).emit('addedToFourPlayers', { message: 'You have been successfully added to the four-player game.' });
        }
        
    })
    socket.on('gameEnd', ({gameId, players, winnerId, gameType}: {gameId: string, players: string[], winnerId: string, gameType: string}) => {
        //update winner wallet with amount and add into wongames
        //update lost players lost game activity
    })
    
    socket.on('disconnect', () => {
        onlineUsers.delete(userId);
    });
})

app.listen(process.env.PORT || 3001 ,()=>{
    console.log(`Connected to localhost on port ${process.env.PORT || 3001}`);
})
