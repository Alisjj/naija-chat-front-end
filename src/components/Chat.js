import React, { useContext, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { AuthContext } from "../contexts/AuthContext";
import { Message } from "./Message";
import InfiniteScroll from "react-infinite-scroll-component";
import { useHotkeys} from 'react-hotkeys-hook';


import { ChatLoader } from "./ChatLoader";

function Chat() {

  const [conversation, setConversation] = useState(null);
  const [typing, setTyping] = useState(false);
  const [page, setPage] = useState(2);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [participants, setParticipants] = useState();
  const { user } = useContext(AuthContext);
  const { conversationName } = useParams();
  // const [welcomeMessage, setWelcomeMessage] = useState("");
  const [messageHistory, setMessageHistory] = useState([]);
  const messagesEndRef = useRef(null);

  const [message, setMessage] = useState("");

  const [meTyping, setMeTyping] = useState(false);
  const timeout = useRef();
  
  function timeoutFunction() {
    setMeTyping(false);
    sendJsonMessage({ type: "typing", typing: false });
  }
  
  function onType() {
    if (meTyping === false) {
      setMeTyping(true);
      sendJsonMessage({ type: "typing", typing: true });
      timeout.current = setTimeout(timeoutFunction, 5000);
    } else {
      clearTimeout(timeout.current);
      timeout.current = setTimeout(timeoutFunction, 5000);
    }
  }
  


  useEffect(() => {
    async function fetchConversation() {
      const apiRes = await fetch(
        `http://127.0.0.1:8000/api/conversations/${conversationName}/`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Token ${user?.token}`,
          },
        }
      );
      if (apiRes.status === 200) {
        const data = await apiRes.json();
        setConversation(data);
      }
    }
    fetchConversation();
  }, [conversationName, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView()

  }, [messageHistory]);

  const inputReference = useHotkeys(
    'enter',
    () => {
      handleSubmit();
    },
    {
      enableOnTags: ['INPUT'],
    }
  );
  
  useEffect(() => {
    (inputReference.current).focus();
  }, [inputReference]);
  
  useEffect(() => () => clearTimeout(timeout.current), []);

  function updateTyping(event) {
    if (event.user !== user?.username) {
      setTyping(event.typing);
    }
  }

  async function fetchMessages() {
    const apiRes = await fetch(
      `http://127.0.0.1:8000/api/messages/?conversation=${conversationName}&page=${page}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );
    if (apiRes.status === 200) {
      const data  = await apiRes.json();
      setHasMoreMessages(data.next !== null);
      setPage(page + 1);
      setMessageHistory((prev) => prev.concat(data.results));
    }
  }

  const { readyState, sendJsonMessage } = useWebSocket(
    user ? `ws://127.0.0.1:8000/chats/${conversationName}/` : null,
    {
      queryParams: {
        token: user ? user.token : "",
      },
      onOpen: () => {
        console.log("Connected!");
      },
      onClose: () => {
        console.log("Disconnected!");
      },
      onMessage: (e) => {
        const data = JSON.parse(e.data);
        switch (data.type) {
          // case "welcome_message":
          //   setWelcomeMessage(data.message);
          //   break;
          case "chat_message_echo":
            setMessageHistory((prev) => [data.message, ...prev]);
            sendJsonMessage({ type: "read_messages" });
            break;
          case "last_50_messages":
            setMessageHistory(data.messages);
            setHasMoreMessages(data.has_more);
            break;

          case "user_join":
            setParticipants((pcpts) => {
              if (!pcpts.includes(data.user)) {
                return [...pcpts, data.user];
              }
              return pcpts;
            });
            break;
          case "user_leave":
            setParticipants((pcpts) => {
              const newPcpts = pcpts.filter((x) => x !== data.user);
              return newPcpts;
            });
            break;
          case "online_user_list":
            setParticipants(data.users);
            break;
          case "typing":
            updateTyping(data)
            break;
          default:
            console.error("Unknown message type!");
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


  useEffect(() => {
    if (connectionStatus === "Open") {
      sendJsonMessage({
        type: "read_messages",
      });
    }
  }, [connectionStatus, sendJsonMessage]);

  console.log(connectionStatus)

  const handleChangeMessage = (e) => {
    setMessage(e.target.value);
    onType();
  };

  const handleSubmit = (e) => {
    // e.preventDefault();
    if (message.length === 0) return;
    if (message.length > 512) return;
    sendJsonMessage({
      type: "chat_message",
      message,
    });
    setMessage("");
    clearTimeout(timeout.current);
    timeoutFunction();
  };

  return (
    <>
      <div className="container mx-auto">
        <div className="max-w-full border rounded">
          <div className="w-full">
            <div className="relative flex items-center p-3 border-b border-gray-300">
              <img
                className="object-cover w-10 h-10 rounded-full"
                src="https://cdn.pixabay.com/photo/2018/01/15/07/51/woman-3083383__340.jpg"
                alt="username"
              />
              {conversation && (
              <span className="block ml-2 font-bold text-gray-600">
                {conversation.other_user.username}
                
                <p className="text-sm text-gray-400">{participants && participants.includes(conversation.other_user.username)
                  ? " online"
                  : " offline"}
                </p>
              </span>)}
              {participants && participants.includes(conversation.other_user.username)
                  ? (<span className="absolute w-3 h-3 bg-green-600 rounded-full left-10 top-3"></span>)
                  : ""}
            </div>
            <div className="relative w-full p-6 overflow-y-auto h-[40rem]">
              <ul className="space-y-2">
                  
                <div
                  id="scrollableDiv"
                  >
                  <div>
                    {/* Put the scroll bar always on the bottom */}
                    <InfiniteScroll
                      dataLength={messageHistory.length}
                      next={fetchMessages}
                      className="flex flex-col-reverse" // To put endMessage and loader to the top
                      inverse={true}
                      hasMore={hasMoreMessages}
                      loader={<ChatLoader />}
                      scrollableTarget="scrollableDiv"
                    >
                    {messageHistory.map((message) => (
                      <Message key={message.id} message={message} />
                    ))}
                    </InfiniteScroll>
                  </div>
                </div>
                {typing && (
                  <p className="truncate text-sm text-gray-500">typing...</p>
                )}
                <div ref={messagesEndRef} />
              </ul>
            </div>
          </div>
          <div className="sm:flex items-center justify-between w-full p-3 border-t border-gray-300">

            <button>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </button>
            <button>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            </button>
            <input type="text" placeholder="Message"
                className="block w-full py-2 pl-4 mx-3 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                name="message" value={message} onChange={handleChangeMessage} required ref={inputReference} maxLength={511} />
            
            <button onClick={handleSubmit}>
                <svg className="w-5 h-5 text-gray-500 origin-center transform rotate-90" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20" fill="currentColor">
                <path
                    d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
            </button>
            </div>
            </div>
      </div>
    </>
  );
}

export default Chat;
