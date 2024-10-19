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
import { GameManager } from './game/GameManager'

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
const io = new Server(server, {
    cors: {
        origin: "*", // Allow any origin (adjust as needed for production)
        methods: ["GET", "POST"], // Allow only specific HTTP methods
    }
});



const gameManager = new GameManager();
  

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
    const userId = data.userId
    gameManager.addUser(socket)
    socket.send('Connected')
    
    socket.on('disconnect', () => {
        gameManager.removeUser(socket)
    });
})

server.listen(process.env.PORT || 3001 ,()=>{
    console.log(`Connected to localhost on port ${process.env.PORT || 3001}`);
})
