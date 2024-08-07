const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

const cookieParser = require('cookie-parser');

const jwt = require('jsonwebtoken');

const cors = require('cors');

const bcrypt = require('bcryptjs');

const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URL);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        credentials: true,
        origin: process.env.CLIENT_URL,
    }
));

app.get('/test', (req, res) => {
    res.json('Test Ok');
});

app.get('/profile', (req, res) => {
    const token = req.cookies?.token;

    if (token) {
        jwt.verify(token, jwtSecret, {}, (error, userData) => {
            if (error) throw error;
            res.json({userData});
        });
    } else {
        res.status(401).json('No Token Found... Sorry!');
    }
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({username});
    
    if (foundUser) {
        const correctPassword = bcrypt.compareSync(password, foundUser.password);
        if (correctPassword) {
            jwt.sign({userId:foundUser._id, username}, jwtSecret, {}, (error, token) => {
                res.cookie('token', token, {sameSite: 'none', secure: true}).json({
                    id: foundUser._id,
                })
            })
        }
    }
})

app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        const createdUser = await User.create({
            username:username, 
            password:hashedPassword
        });
        jwt.sign({userId:createdUser._id, username}, jwtSecret, {}, (error, token) => {
            if (error) throw error;
            res.cookie('token', token, {sameSite: 'none', secure: true}).status(201).json({
                id: createdUser._id,
            });
        });
    } catch(error) {
        if (error) throw error; 
    }
});

app.listen(3000);