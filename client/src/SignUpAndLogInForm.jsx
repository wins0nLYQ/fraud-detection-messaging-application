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

        try {
            const {data} = await axios.post(url, {username, password});
            setLoggedInUsername(username);
            setId(data.id);
        } catch (error) {
            if (error.response.data) {
                // Show error message from the backend
                alert(error.response.data);
            } else {
                alert('An unexpected error occurred. Please try again.');
            }

            setUsername('');
            setPassword('');
        }
    };

    return (
        <div className="bg-purple-50 h-screen flex items-center">
            <form action="" className="w-64 mx-auto mb-12" onSubmit={handleSubmit}>
                <div className="mb-7 text-center font-quicksand text-6xl font-semibold text-purple-500">
                    {isLoginOrRegister === 'signup' && (
                        <div>Sign Up</div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>Log In</div>
                    )}
                </div>

                <input
                       value={username} 
                       onChange={ev => setUsername(ev.target.value)}
                       type="text" 
                       placeholder="Username" 
                       className="block w-full rounded-md p-2 mb-2 border 
                                  focus:outline-none 
                                  focus:border-purple-500
                                  focus:ring-purple-500
                                  focus:ring-1" />
                <input 
                       value={password} 
                       onChange={ev => setPassword(ev.target.value)} 
                       type="password"
                       placeholder="Password"
                       className="block w-full rounded-md p-2 mb-2 border
                                  focus:outline-none 
                                  focus:border-purple-500
                                  focus:ring-purple-500
                                  focus:ring-1" />
                
                <button className="bg-purple-500 text-white block w-full rounded-full p-2 mt-4" >
                    {isLoginOrRegister === 'signup' ? 'Sign Up' : 'Login'}
                </button>

                <div className="text-center mt-2">
                    {isLoginOrRegister === 'signup' && (
                        <div>
                            Already a Member?
                            <button className="ml-1 text-purple-600" onClick={() => setIsLoginOrRegister('login')}>
                                Log In
                            </button>
                        </div>
                    )}
                    {isLoginOrRegister === 'login' && (
                        <div>
                            Don't have an account?
                            <button className="ml-1 text-purple-600" onClick={() => setIsLoginOrRegister('signup')}>
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    )
};