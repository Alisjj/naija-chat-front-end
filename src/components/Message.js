import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';


export function classNames(...classes){
    return classes.filter(Boolean).join(" ");
}
export function Message({message}) {
    const {user} = useContext(AuthContext)

    function formatMessageTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString().slice(0,5);
    }
    
  return (
    
    <li className={classNames(
        "flex mt-4",
        user.username === message.to_user.username
        ? "justify-start": "justify-end"
        )}>
        <div className={classNames("relative max-w-xl px-4 py-2 text-gray-700 rounded drop-shadow-xl shadow-indigo-500/40",
            user.username === message.to_user.username
            ? "bg-gray-300": "bg-red-300"
        )}>
            <span className="block max-w-2xl break-words">{message.content}</span>
            <span
                className="ml-2"
                style={{
                fontSize: "0.6rem",
                lineHeight: "1rem",
                }}
            >
                {formatMessageTimestamp(message.timestamp)}
            </span>
        </div>
    </li>

  )
  
}