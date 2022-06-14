import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Chat from "./components/Chat";
import { Login } from "./components/Login";
import { Navbar } from "./components/Navbar";
import {AuthContextProvider} from './contexts/AuthContext';
import Conversations from './components/Conversations';
import ProtectedRoute from "./components/ProtectedRoute";
import {ActiveConversations} from './components/ActiveConversations';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <AuthContextProvider> <Navbar /> </AuthContextProvider>}>
          <Route path="" element={
            <ProtectedRoute>
              <Conversations />
            </ProtectedRoute>
          } />
          <Route path="chats/:conversationName" element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          } />
          <Route
            path="conversations/"
            element={
              <ProtectedRoute>
                <ActiveConversations />
              </ProtectedRoute>
            }
          />
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App;
