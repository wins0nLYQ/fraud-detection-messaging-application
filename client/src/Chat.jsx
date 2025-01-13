import { useEffect, useState, useContext, useRef } from "react";
import TextareaAutosize from 'react-textarea-autosize';
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";
import Contact from "./Contact";


export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlineUser, setOnlineUser] = useState({});
    const [offlineUser, setOfflineUser] = useState({});
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [newMessageText, setNewMessageText] = useState('');
    const [messages, setMessages] = useState([]);

    const {username,id,setId,setUsername} = useContext(UserContext);
    const divUnderMessages = useRef();

    const [isTwoRows, setIsTwoRows] = useState(false);
    const textareaRef = useRef(null); 
    
    useEffect(() => {
        connectToWebSocket();
    }, []);

    // connection to WebSocket
    function connectToWebSocket() {
        const ws = new WebSocket('ws://localhost:3000');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect.');
                connectToWebSocket();
            }, 500);
        });
    }

    // Function to show online users
    function showOnlinePeople(userArray) {
        const user = {};
        userArray.forEach(({userId, username}) => {
            user[userId] = username;
        });
        setOnlineUser(user);
    }
 
    // Function to trigger push notification
    function showFraudNotification() {
        if (Notification.permission === 'granted') {
            new Notification("Fraud Alert!", {
                body: 'Potential Fraud Risk',
            });
        }
    }

    // Function to handle message
    function handleMessage(event) {
        const messageData = JSON.parse(event.data);

        if ('online' in messageData) {
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            const isFraud = messageData.fraud;

            if (messageData.sender === selectedUserId) {
                setMessages(prev => ([...prev, {...messageData}]));
            }

            if (isFraud) {
                showFraudNotification();
            }
        }
    }
 
    // Logout function
    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }

    // Function to make API request to model prediction
    async function modelPrediction() {
        let response = await axios.post('http://127.0.0.1:5000/predict', {
            text: newMessageText
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return response.data.prediction;
    }
  
    // Send message function
    async function sendMessage(event, file=null) {
        if (event) event.preventDefault();

        if (file || newMessageText) {
            let prediction = null;

            // Make model prediction for fraud detection on text messages only
            if (newMessageText !== "") {
                prediction = await modelPrediction();
            }

            ws.send(JSON.stringify(
                {
                    recipient: selectedUserId,
                    text: newMessageText,
                    fraud: prediction,
                    file,
                }
            ));

            // Send file else clear message field
            if (file) {
                axios.get('/messages/'+selectedUserId).then(
                    res => {
                        setMessages(res.data);
                    }
                )
            } else {
                setNewMessageText('');

                setMessages(prev => ([...prev, {
                    text: newMessageText, 
                    sender: id,
                    recipient: selectedUserId,
                    _id: Date.now(),
                }]));
            }
        }
    }

    // Send file function
    function sendFile(event) {
        const reader = new FileReader(event.target.files[0]);
        reader.readAsDataURL(event.target.files[0]);
        reader.onload = () => {
            sendMessage(null, {
                name: event.target.files[0].name,
                data: reader.result,
            })
        };
    }

    useEffect(() => {
        const div = divUnderMessages.current;
        if (div) {
            div.scrollIntoView({behavior: 'smooth', block:'end'});
        }
    }, [messages]);

    useEffect(() => {
        axios.get('/user').then(res => {
            const offlineUserArray = res.data
                .filter(user => user._id !== id)
                .filter(user => !Object.keys(onlineUser).includes(user._id));

            const offlineUser = {};
            offlineUserArray.forEach(user => {
                offlineUser[user._id] = user;
            })

            setOfflineUser(offlineUser);
        })
    }, [onlineUser]);

    useEffect(() => {
        if (selectedUserId) {
            axios.get('/messages/'+selectedUserId).then(
                res => {
                    setMessages(res.data);
                }
            )
        }
    },[selectedUserId]);

    useEffect(() => {
        if (textareaRef.current) {
          const lineHeight = 24;
          const height = textareaRef.current.offsetHeight;
          const rows = Math.floor(height / lineHeight);
    
          setIsTwoRows(rows >= 2); // Set the state to true if 2 rows are reached
        }
      }, [newMessageText]);

    const onlineUserExcludeOwner = {...onlineUser};
    delete onlineUserExcludeOwner[id];

    const messagesWithoutDupes = uniqBy(messages, '_id');

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/5 flex flex-col">
                <div className="flex-grow">
                    <Logo />

                    {Object.keys(onlineUserExcludeOwner).map(userId => (
                        <Contact
                            key={userId}
                            id={userId}
                            online={true}
                            username={onlineUserExcludeOwner[userId]}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}

                    {Object.keys(offlineUser).map(userId => (
                        <Contact 
                            key={userId}
                            id={userId}
                            online={false}
                            username={offlineUser[userId].username}
                            onClick={() => setSelectedUserId(userId)}
                            selected={userId === selectedUserId}
                        />
                    ))}    
                </div>

                <div className="p-3 text-center flex flex-col items-center">
                    <span className="py-2 text-[15px] text-gray-800 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5 mr-1">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                        {username}
                    </span>

                    <button onClick={logout} className="h-[35px] w-full max-w-[220px] text-sm bg-purple-600 py-1 px-2 text-white rounded-full">
                        Logout
                    </button> 
                </div>
            </div>
            <div className="flex flex-col bg-purple-100 w-4/5 p-2">
                <div className="flex-grow">
                    {!selectedUserId && (
                        <div className="flex h-full flex-grow items-center justify-center">
                            <div className="text-gray-300">&larr; Select a person from the sidebar to start chat</div>
                        </div>
                    )}
                    {!!selectedUserId && (
                        <div className="relative h-full">
                            <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                                {messagesWithoutDupes.map(message => (
                                    <div key={message._id} className={"text-sm " + (message.sender === id ? 'text-right pl-32' : 'text-left pr-32 flex')}>
                                        <div className={"text-left inline-block p-2 my-2 rounded-lg  " + (message.sender === id ? 'bg-purple-600 text-white ' : 'bg-white text-gray-630 ') + (message.fraud === 1 && message.sender !== id ? 'border-2 border-red-500' : '')}>
                                            {message.text}
                                            {message.file && (
                                                <div>
                                                    <a target="_blank" className="flex items-center gap-1" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                        </svg>

                                                        <div className="border-b">{message.file}</div>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center pl-2">
                                            {message.sender !== id && message.fraud === 1 && (
                                                // Add JS function code here
                                                <div className="relative group">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6 text-red-600">
                                                        <path fillRule="evenodd" d="M11.484 2.17a.75.75 0 0 1 1.032 0 11.209 11.209 0 0 0 7.877 3.08.75.75 0 0 1 .722.515 12.74 12.74 0 0 1 .635 3.985c0 5.942-4.064 10.933-9.563 12.348a.749.749 0 0 1-.374 0C6.314 20.683 2.25 15.692 2.25 9.75c0-1.39.223-2.73.635-3.985a.75.75 0 0 1 .722-.516l.143.001c2.996 0 5.718-1.17 7.734-3.08ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75ZM12 15a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75v-.008a.75.75 0 0 0-.75-.75H12Z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="absolute w-[100px] bottom-full left-1/2 translate-x-5 translate-y-10 mb-2 px-2 py-1 bg-red-600 text-white text-xs rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                                                    Alert: Potential Fraud Risk!
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                <div ref={divUnderMessages}></div>
                            </div>
                        </div>
                    )}
                </div>
                {!!selectedUserId && (
                    <form className="flex gap-1 items-end" onSubmit={sendMessage}>
                        <label className="w-[42px] h-[42px] text-gray-800 cursor-pointer rounded-full flex items-center justify-center">
                            <input type="file" className="hidden" onChange={sendFile}/>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                            </svg>

                        </label>
                        
                        <TextareaAutosize
                                ref={textareaRef} 
                                type="text" 
                                value={newMessageText}
                                onChange={ev => setNewMessageText(ev.target.value)}
                                minRows={1} 
                                maxRows={3}
                                placeholder="Type your message here" 
                                className={"bg-white flex-grow rounded-full px-4 py-2 mr-2 resize-none focus:outline-none " + 
                                    (isTwoRows ? 'rounded-lg' : 'rounded-full')
                                }
                        />

                        <button type="submit" className="w-[41px] h-[41px] bg-purple-600 p-2 text-white rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                                viewBox="0 0 24 24" strokeWidth={1.5} 
                                stroke="currentColor" className="w-5 h-6">
                                <path strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}