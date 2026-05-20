/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axiosConfig';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeChatId, setActiveChatId] = useState(null);
  
  const activeChatIdRef = useRef(activeChatId);

  // Sync user state on route change
  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
      setUser(currentUser);
    }
  }, [location.pathname, user]);

  // Keep activeChatIdRef in sync
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Fetch all unread counts
  const fetchUnreadCounts = async () => {
    const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!currentUser) return;
    try {
      // 1. Fetch unread chat count
      const chatRes = await api.get('/chats/unread/count');
      if (chatRes.data.success) {
        setUnreadChatCount(chatRes.data.count);
      }
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUnreadCounts();
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      unreadNotificationCount,
      setUnreadNotificationCount,
      unreadChatCount,
      setUnreadChatCount,
      activeChatId,
      setActiveChatId,
      fetchUnreadCounts
    }}>
      {children}
    </NotificationContext.Provider>
  );
};