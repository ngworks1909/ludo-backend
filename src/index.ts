import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import adminRouter from './routes/adminRoute'
import contestRouter from './routes/contestRoute'
import userRouter from './routes/userRoute'
import transactionRouter from './routes/transactionRoute'
import bannerRouter from './routes/bannerRoute'

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

app.listen(process.env.PORT || 3001 ,()=>{
    console.log(`Connected to localhost on port ${process.env.PORT || 3001}`);
})
