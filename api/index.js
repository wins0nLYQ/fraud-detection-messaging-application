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

const fileSystem = require('fs');

mongoose.connect(process.env.MONGODB_URL);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);
 
const app = express();
app.use('/uploads', express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors(
    {
        credentials: true,
        origin: process.env.CLIENT_URL,
    }
));

async function getUserDataFromRequest(req) {
    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;

        if (token) {
            jwt.verify(token, jwtSecret, {}, (error, userData) => {
                if (error) throw error;
                resolve(userData);
            });
        } else {
            reject('No Token');
        }
    })
}

// Test API connection
app.get('/test', (req, res) => {
    res.json('Test Ok');
});

app.get('/messages/:userId', async (req, res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;

    const messages = await Message.find({
       sender: {$in: [userId, ourUserId]},
       recipient: {$in: [userId, ourUserId]}
    }).sort({createdAt: 1});

    res.json(messages);
})

app.get('/user', async (req, res) => {
    const users = await User.find({}, {'_id': true, username: true});
    res.json(users);
})

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

app.post('/logout', (req, res) => {
    res.cookie('token', '', {sameSite: 'none', secure: true}).json('ok');
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

    function notifyAboutOnlineUser() {
        [...webSocketServer.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...webSocketServer.clients].map(client => ({userId:client.userId, 
                    username:client.username}))
            }));
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlineUser();
        }, 1000);
    }, 3000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    })

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
        const {recipient, text, file} = messageData;
        let fileName = null;
        if (file) {
            const fileParts = file.name.split('.');
            const extension = fileParts[fileParts.length-1];
            fileName = Date.now() + '.' + extension;
            const path = __dirname + '/uploads/' + fileName;
            const bufferData = Buffer.from(file.data.split(',')[1], 'base64');

            fileSystem.writeFile(path, bufferData, () => {
                console.log('file saved: ' + path);
            });
        };

        if (recipient && (text || file)) {
            const messageDoc = await Message.create({
                sender: connection.userId,
                recipient, 
                text,
                file: file ? fileName : null,
            });

            [...webSocketServer.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify(
                    {
                        text, 
                        sender:connection.userId,
                        recipient,
                        file: file ? fileName : null,
                        _id: messageDoc._id,
                    }
                )));
        }
    });

    // notify everyone about online people (when someone connects)
    notifyAboutOnlineUser();
}); 