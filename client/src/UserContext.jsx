import { createContext } from "react";

const UserContext = createContext({});

function UserContextProvider() {
    const [username, setUsername] = useState(null);
    const [id, setId] = useState(null);

    return(
        <UserContext.Provider value={{username, setUsername, id, setId}}>
            {children}
        </UserContext.Provider>
    );
}

export default UserContextProvider;