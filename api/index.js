const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

const cookieParser = require('cookie-parser');

const jwt = require('jsonwebtoken');

const cors = require('cors');

const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Message = require('./models/Message');

const webSocket = require('ws');

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

// Test API connection
app.get('/test', (req, res) => {
    res.json('Test Ok');
});

// Get user profile API
app.get('/profile', (req, res) => {
    const token = req.cookies?.token;

    if (token) {
        jwt.verify(token, jwtSecret, {}, (error, userData) => {
            if (error) throw error;
            res.json(userData);
        });
    } else {
        res.status(401).json('No Token Found... Sorry!');
    }
})

// Login API
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

// Sign up API
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

const server = app.listen(3000);

// Socket.IO Setup
const webSocketServer = new webSocket.WebSocketServer({server});
webSocketServer.on('connection', (connection, req) => {

    // Read username and ID form the cookie for this connection
    const cookies = req.headers.cookie;

    if (cookies) {
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='))
        
        if (tokenCookieString) {
            const token = tokenCookieString.split('=')[1];

            if (token) {
                jwt.verify(token, jwtSecret, {}, (error, userData) => {
                    if (error) throw error;
                    const {userId, username} = userData;
                    connection.userId = userId;
                    connection.username = username;
                })
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const {recipient, text} = messageData;
        if (recipient && text) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient, 
                text,
            });

            [...webSocketServer.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify(
                    {
                        text, 
                        sender:connection.userId,
                        recipient,
                        id: messageDoc._id,
                    }
                )));
        }
    });

    // notify everyone about online people (when someone connects)
    [...webSocketServer.clients].forEach(client => {
        client.send(JSON.stringify({
            online: [...webSocketServer.clients].map(client => ({userId:client.userId, 
                username:client.username}))
        }));
    });
});