import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user, token } = useAuth();

  useEffect(() => {
    // Only connect if we have a logged-in user
    if (user && token) {
      const backendURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const newSocket = io(backendURL, {
        withCredentials: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      setSocket(newSocket);

      newSocket.on('connect', () => {
        // Register the user with the server
        newSocket.emit('register', user._id);
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]); // Only re-run when user or token changes

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
