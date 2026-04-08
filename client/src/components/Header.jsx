import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useBoardStore } from '../store/boardStore';

export default function Header({ projectName, projectId, workspaceName, activeTab, onTabChange }) {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead } = useNotificationStore();
  const { searchQuery, setSearchQuery } = useBoardStore();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  const notifRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    if (token) fetchNotifications(token);
  }, [token, fetchNotifications]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F4F4F2]/80 backdrop-blur-xl border-b border-gray-200/30">
      <div className="flex items-center justify-between px-8 py-4">
        
        {/* Left: Logo + Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src="/logo.png" alt="QuickTeam" className="w-8 h-8 rounded-lg group-hover:scale-110 transition-transform shadow-sm" />
            <span className="font-bold text-lg tracking-tight text-gray-900">QuickTeam</span>
          </Link>
          
          {projectName && (
            <div className="flex items-center gap-1.5 ml-2 text-sm">
              <ChevronRight size={14} className="text-gray-300" />
              <span className="text-gray-900 font-semibold">{projectName}</span>
            </div>
          )}
        </div>

        {/* Center: Board/Analytics toggle (only on project Board page) */}
        {projectId && onTabChange && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <div className="flex bg-white/60 p-1 rounded-full border border-gray-200/50 shadow-sm backdrop-blur-sm">
              <button 
                onClick={() => onTabChange('board')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'board' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
              >
                Board
              </button>
              <button 
                onClick={() => onTabChange('analytics')}
                className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'analytics' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
              >
                Analytics
              </button>
            </div>
          </div>
        )}

        {/* Right: Search + Notifications + User */}
        <div className="flex items-center gap-2">
          
          {/* Search */}
          <div className={`flex items-center transition-all duration-300 ${showSearch ? 'bg-white rounded-full shadow-sm border border-gray-200 px-3' : ''}`}>
            {showSearch && (
              <input
                type="text"
                placeholder="Search tasks..."
                autoFocus
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                className="bg-transparent border-none outline-none text-sm w-44 placeholder-gray-400 py-2"
              />
            )}
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showSearch ? 'text-black' : 'text-gray-400 hover:text-black hover:bg-white'}`}
            >
              <Search size={17} strokeWidth={1.5} />
            </button>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-white transition-colors relative"
            >
              <Bell size={17} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#F4F4F2]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-bold">{unreadCount} new</span>}
                </div>
                <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-xs">You're all caught up!</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-[#EBCBEE]/10' : ''}`}
                        onClick={() => { if (!n.isRead) markAsRead(n.id, token); }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 mt-1.5 shrink-0 rounded-full ${!n.isRead ? 'bg-red-500' : 'bg-transparent'}`} />
                          <div className="flex-1">
                            <p className={`text-sm leading-snug ${!n.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">{new Date(n.createdAt).toLocaleString('uk-UA')}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar + Dropdown */}
          <div className="relative" ref={userRef}>
            <button 
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-black/10 transition-colors"
            >
              <img 
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'U'}&background=EBCBEE&color=1A1A1A&bold=true`} 
                alt={user?.name} 
                className="w-full h-full object-cover"
              />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Settings
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
