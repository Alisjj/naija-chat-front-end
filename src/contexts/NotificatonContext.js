import React, { createContext, useContext, useState } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { AuthContext } from "./AuthContext";

const DefaultProps = {
  unreadMessageCount: 0,
  connectionStatus: "Uninstantiated",
};


export const NotificationContext =
  createContext(DefaultProps);

export const NotificationContextProvider = ({
  children,
}) => {
  const { user } = useContext(AuthContext);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const { readyState } = useWebSocket(
    user ? `wss://n-chat-backend.herokuapp.com/notifications/` : null,
    {
      queryParams: {
        token: user ? user.token : "",
      },
      onOpen: () => {
        console.log("Connected to Notifications!");
      },
      onClose: () => {
        console.log("Disconnected from Notifications!");
      },
      onMessage: (e) => {
        const data = JSON.parse(e.data);
        switch (data.type) {
            case "unread_count":
                setUnreadMessageCount(data.unread_count);
                break;
            case "new_message_notification":
                setUnreadMessageCount((count) => (count += 1));
                break;
            default:
                console.error(`Unknown message type!${data.type}`);
                break;
        }
      },
    }
  );

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <NotificationContext.Provider
      value={{ unreadMessageCount, connectionStatus }}
    >
      {children}
    </NotificationContext.Provider>
  );
};