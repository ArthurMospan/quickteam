import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  fetchNotifications: async (token) => {
    try {
      const res = await fetch('https://quickteam.onrender.com/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      set({ 
        notifications: data, 
        unreadCount: data.filter(n => !n.isRead).length 
      });
    } catch (err) {
      console.error(err);
    }
  },

  markAsRead: async (id, token) => {
    try {
      // Optimistic update
      set(state => {
        const updated = state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
        return { notifications: updated, unreadCount: updated.filter(n => !n.isRead).length };
      });
      await fetch(`https://quickteam.onrender.com/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  }
}));
