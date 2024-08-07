import axios from "axios";
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";

export default function App() {
  axios.defaults.baseURL = 'http://localhost:3000';
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
      <Routes />
    </UserContextProvider>
  )
}