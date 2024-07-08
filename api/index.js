const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

const jwt = require('jsonwebtoken');

const cors = require('cors');

const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URL);

const jwtSecret = process.env.JWT_SECRET;

const app = express();
app.use(express.json());

app.use(cors(
    {
        credentials: true,
        origin: process.env.CLIENT_URL,
    }
));

app.get('/test', (req, res) => {
    res.json('Test Ok');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const createdUser = await User.create({username, password});
        jwt.sign({userId:createdUser._id}, jwtSecret, {}, (error, token) => {
            if (error) throw error;
            res.cookie('token', token).status(201).json({
                id: createdUser._id
            });
        });
    } catch(error) {
        if (error) throw error;
    }
});

app.listen(3000);