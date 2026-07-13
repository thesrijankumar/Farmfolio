import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import connectDb from './src/config/connectDb.js';

const app = express();
connectDb();

app.get('/', (req, res) => {
    res.send("Greetings from Backend !!~")
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running successfully at http://localhost:${process.env.PORT}`);
})