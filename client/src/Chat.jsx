import { useEffect, useState } from "react"
import Avatar from "./Avatar";


export default function Chat() {
    const [ws, setWs] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:3000');
        setWs(ws);
        ws.addEventListener('message', handleMessage);
    }, []);

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
        }
    }

    return (
        <div className="flex h-screen">
            <div className="bg-white w-1/3 pl-4 pt-4">
                <div className="text-blue-600 font-bold flex gap-2 mb-4">
                    {/* SVG Chat Logo */}
                    MernChat
                </div>
                
                {Object.keys(onlineUser).map(userId => (
                    <div className="border-b border-gray-100 py-2">
                        <Avatar />
                        {onlineUser[userId]}
                    </div>
                ))}
            </div>
            <div className="flex flex-col bg-blue-50 w-2/3 p-2">
                <div className="flex-grow">
                    Messages with selected person
                </div>
                <div className="flex gap-2">
                    <input type="text" 
                            placeholder="Type your message here" 
                            className="bg-white flex-grow border rounded-md p-2"/>
                    <button className="bg-blue-500 p-2 text-white rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" 
                             viewBox="0 0 24 24" strokeWidth={1.5} 
                             stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}