import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import dbConnect from './src/config/dbConnect.js';

const app = express();
dbConnect();

app.get('/', (req, res) => {
    res.send("Greetings from Backend !!~")
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running successfully at http://localhost:${process.env.PORT}`);
})