import axios from "axios";
import { useState, useContext } from "react";
import { UserContext } from "./UserContext.jsx";

export default function SignUpAndLogInForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('signup');

    const {setUsername:setLoggedInUsername, setId} = useContext(UserContext);

    async function handleSubmit(ev) {
        ev.preventDefault();
        const url = isLoginOrRegister === 'signup' ? 'signup' : 'login';
        const {data} = await axios.post(url, {username, password});
        setLoggedInUsername(username);
        setId(data.id);
    };

    return (
        <div className="bg-blue-50 h-screen flex items-center">
            <form action="" className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                <input 
                       value={username} 
                       onChange={ev => setUsername(ev.target.value)}
                       type="text" 
                       placeholder="Username" 
                       className="block w-full rounded-sm p-2 mb-2 border" />
                <input 
                       value={password} 
                       onChange={ev => setPassword(ev.target.value)} 
                       type="password"
                       placeholder="Password"
                       className="block w-full rounded-sm p-2 mb-2 border" />
                <button className="bg-blue-500 text-white block w-full rounded-sm p-2" >
                    {isLoginOrRegister === 'signup' ? 'Sign Up' : 'Login'}
                </button>
                <div className="text-center mt-2">
                    {isLoginOrRegister === 'signup' && (
                        <div>
                            Already a Member? <b/>
                            <button onClick={() => setIsLoginOrRegister('login')}>
                                Log In
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            Don't have an account? <b/>
                            <button onClick={() => setIsLoginOrRegister('signup')}>
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
};