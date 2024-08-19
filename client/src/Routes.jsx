import { useContext, useEffect } from "react";
import { UserContext } from "./UserContext.jsx";
import SignUpAndLogInForm from "./SignUpAndLogInForm.jsx";
import Chat from "./Chat.jsx";

export default function Routes() {
    const {username, id} = useContext(UserContext);

    if (username) {
        return <Chat />;
    }

    return (
        <SignUpAndLogInForm />
    )
}