require('dotenv').config()
const express = require('express');

const app = express();

app.get('/', (req, res) => {
    res.send("Greetings from Backend !!~")
})

app.listen(process.env.PORT, () => {
    console.log(`Server is running successfully at http://localhost:${process.env.PORT}`);
})