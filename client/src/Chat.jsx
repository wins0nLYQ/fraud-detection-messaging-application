import { useEffect, useState, useContext, useRef } from "react"
import Avatar from "./Avatar";
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
    
    useEffect(() => {
        connectToWebSocket();
    }, []);

    function connectToWebSocket() {
        const ws = new WebSocket('ws://localhost:3000');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', () => {
            setTimeout(() => {
                console.log('Disconnected. Trying to reconnect.');
                connectToWebSocket();
            }, 1000);
        });
    }

    function showOnlinePeople(userArray) {
        const user = {};
        userArray.forEach(({userId, username}) => {
            user[userId] = username;
        });
        setOnlineUser(user);
    }

    function handleMessage(event) {
        const messageData = JSON.parse(event.data);

        if ('online' in messageData) {
            showOnlinePeople(messageData.online);
        } else if ('text' in messageData) {
            if (messageData.sender === selectedUserId) {
                setMessages(prev => ([...prev, {...messageData}]));
            }
        }
    }

    function logout() {
        axios.post('/logout').then(() => {
            setWs(null);
            setId(null);
            setUsername(null);
        })
    }

    function sendMessage(event, file=null) {
        if (event) event.preventDefault();
        ws.send(JSON.stringify(
            {
                recipient: selectedUserId,
                text: newMessageText,
                file,
            }
        ));

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

    const onlineUserExcludeOwner = {...onlineUser};
    delete onlineUserExcludeOwner[id];

    const messagesWithoutDupes = uniqBy(messages, '_id');

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 flex flex-col">
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

                <div className="p-2 text-center flex items-center justify-center">
                    <span className="mr-2 text-sm text-gray-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-0.5">
                            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                        {username}
                    </span>

                    <button onClick={logout} className="text-sm bg-blue-100 py-1 px-2 text-gray-600 border rounded-md">
                        Logout
                    </button>
                </div>
            </div>
            <div className="flex flex-col bg-blue-50 w-2/3 p-2">
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
                                    <div key={message._id} className={(message.sender === id ? 'text-right' : 'text-left')}>
                                        <div className={"text-left inline-block p-2 my-2 rounded-md text-sm " + (message.sender === id ? 'bg-blue-500 text-white' : 'bg-white text-gray-630')}>
                                            {message.text}
                                            {message.file && (
                                                <div>
                                                    <a target="_blank" className="flex items-center gap-1 border-b" href={axios.defaults.baseURL + '/uploads/' + message.file}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                                                        </svg>
                                                        {message.file}
                                                    </a>
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
                    <form className="flex gap-2" onSubmit={sendMessage}>
                        <input type="text" 
                                value={newMessageText}
                                onChange={ev => setNewMessageText(ev.target.value)}
                                placeholder="Type your message here" 
                                className="bg-white flex-grow border rounded-md p-2"/>
                        
                        <label className="bg-blue-200 p-2 text-gray-600 cursor-pointer rounded-md border border-blue-200">
                            <input type="file" className="hidden" onChange={sendFile}/>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                            </svg>

                        </label>

                        <button type="submit" className="bg-blue-500 p-2 text-white rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                                viewBox="0 0 24 24" strokeWidth={1.5} 
                                stroke="currentColor" className="w-6 h-6">
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