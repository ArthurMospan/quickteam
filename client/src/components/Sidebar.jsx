import React from 'react';
import { Layers, Briefcase, Users, Plus, BarChart3 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav({ onCreateClick }) {
  const location = useLocation();

  const leftItems = [
    { name: 'Home', path: '/', icon: Layers },
    { name: 'Projects', path: '/projects', icon: Briefcase },
  ];

  const rightItems = [
    { name: 'Team', path: '/team', icon: Users },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
    return (
      <Link 
        key={item.name} 
        to={item.path} 
        className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
          isActive 
            ? 'bg-black text-white' 
            : 'text-gray-400 hover:text-black hover:bg-gray-100'
        }`}
      >
        <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
        <span className="text-[10px] font-semibold tracking-wide">{item.name}</span>
      </Link>
    );
  };

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 bg-white/80 backdrop-blur-xl px-3 py-2 rounded-full shadow-lg border border-gray-200/50">
        {leftItems.map(renderNavItem)}

        {/* Center Create Button */}
        <button
          onClick={onCreateClick || (() => {})}
          className="w-12 h-12 mx-2 rounded-full bg-black flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-transform border-4 border-white"
          title="Create Task"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>

        {rightItems.map(renderNavItem)}
      </div>
    </nav>
  );
}
