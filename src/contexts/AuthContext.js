import React, { useState } from 'react'
import { authService } from '../services/authentication'
import axios from 'axios';

export const AuthContext = React.createContext(null)

export function AuthContextProvider({ children }) {

    const [user, setUser] = useState(() => {
        return authService.getUser()
    })

    function logout() {
        authService.logout()
        setUser(null)
    }
    
    // function login() {
    //     // const user = authService.login()
    //     setUser(user)
    // }
    async function login(username, password){
        const response = await axios.post("http://127.0.0.1:8000/auth-token/", { username, password });
        if (!response.data.token) {
          return response.data;
        }
        const user = authService.login(response.data.token, response.data.username)
        setUser(user);
        return response.data;
      }

    return (
        <AuthContext.Provider value={{
            logout,
            login,
            user
        }}>
            {children}
        </AuthContext.Provider>
    )
}