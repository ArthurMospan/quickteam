import React, { useState } from 'react';
import { Calendar, Bookmark, MoreHorizontal, Edit2, Copy, Trash2, CheckCircle2 } from 'lucide-react';

export default function TaskCard({ task, onDragStart, onClick }) {
  const [showMenu, setShowMenu] = useState(false);

  // Liquid Glass iOS Style config - much more vibrant and case-insensitive
  const pMap = {
    'critical': {
      glow: '0 7px 14px -5px rgba(255, 77, 77, 0.15)',
      inner: 'rgba(255, 77, 77, 0.35)',
      badge: 'bg-[#ff4d4d]/20 text-[#ff4d4d]',
      dot: 'bg-[#ff4d4d]',
    },
    'high': {
      glow: '0 7px 14px -5px rgba(255, 204, 0, 0.15)',
      inner: 'rgba(255, 204, 0, 0.35)',
      badge: 'bg-[#ffcc00]/20 text-[#d49900]',
      dot: 'bg-[#ffcc00]',
    },
    'medium': {
      glow: '0 7px 14px -5px rgba(102, 204, 255, 0.15)',
      inner: 'rgba(102, 204, 255, 0.35)',
      badge: 'bg-[#66ccff]/20 text-[#0088ee]',
      dot: 'bg-[#66ccff]',
    },
    'low': {
      glow: '0 7px 14px -5px rgba(204, 255, 0, 0.15)',
      inner: 'rgba(204, 255, 0, 0.35)',
      badge: 'bg-[#ccff00]/20 text-[#779900]',
      dot: 'bg-[#ccff00]',
    },
  };
  
  const pKey = (task.priority || 'Medium').toLowerCase();
  const cfg = pMap[pKey] || pMap.medium;
  const priority = task.priority || 'Medium';
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div
      draggable={!showMenu}
      onDragStart={(e) => {
        if (showMenu) {
          e.preventDefault();
          return;
        }
        e.stopPropagation();
        onDragStart(e, task.id);
      }}
      onClick={() => {
        if (!showMenu && onClick) onClick(task);
      }}
      onMouseLeave={() => setShowMenu(false)}
      className="p-5 rounded-[32px] bg-white/70 backdrop-blur-3xl border border-white/60 cursor-pointer hover:-translate-y-2 transition-all duration-500 relative group overflow-hidden"
      style={{ boxShadow: cfg.glow }}
    >
      {/* Inner Liquid Glow Effect - Layered Blobs */}
      <div 
        className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full blur-[60px] opacity-80 pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(circle, ${cfg.inner} 0%, transparent 70%)` }}
      />
      <div 
        className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-all duration-700"
        style={{ background: `radial-gradient(circle, ${cfg.inner} 0%, transparent 70%)` }}
      />
      
      {/* Specular Edge Highlighting */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
      <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/30 to-transparent z-10" />
      {/* Striped overlay menu */}
      <div 
        className={`absolute inset-0 z-20 flex flex-col justify-center items-center gap-3 transition-all duration-300 ${showMenu ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{
          background: 'repeating-linear-gradient(-45deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9) 10px, rgba(250,250,250,0.95) 10px, rgba(250,250,250,0.95) 20px)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClick && onClick(task); }} className="w-4/5 py-2.5 bg-white rounded-xl shadow-sm text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-gray-900 border border-gray-100">
          <Edit2 size={14} /> Edit Task
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} className="w-4/5 py-2.5 bg-white rounded-xl shadow-sm text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-gray-900 border border-gray-100">
          <Copy size={14} /> Duplicate
        </button>
        <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} className="w-4/5 py-2.5 bg-red-50 rounded-xl shadow-sm text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors text-red-600 border border-red-100">
          <Trash2 size={14} /> Delete
        </button>
        
        {/* Close menu button floating top right */}
        <button onClick={handleMenuClick} className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400 hover:text-black">
           <MoreHorizontal size={16} />
        </button>
      </div>

      <div className={`transition-opacity duration-300 ${showMenu ? 'opacity-0' : 'opacity-100'}`}>
        {/* Top row: priority + kebab */}
        <div className="flex items-center justify-between mb-3">
          <span className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${cfg.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
            {priority}
          </span>

          <div className="flex items-center gap-2">
            {task.hasBookmark && (
              <div className="w-6 h-6 bg-black/10 rounded-full flex items-center justify-center text-black/60">
                <Bookmark size={10} fill="currentColor" />
              </div>
            )}
            <button 
              onClick={handleMenuClick}
              className="w-8 h-8 bg-black/5 hover:bg-black/10 rounded-full flex items-center justify-center text-black/60 transition-colors hidden group-hover:flex"
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-[16px] leading-tight text-black mb-3 line-clamp-2">
          {task.title}
        </h3>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4 flex-wrap">
            {task.tags.slice(0, 3).map((tt) => (
              <span
                key={tt.id || tt.tag?.id}
                className="px-2.5 py-1 text-[9px] font-extrabold rounded-full text-white uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: tt.color || tt.tag?.color || '#999' }}
              >
                {tt.name || tt.tag?.name}
              </span>
            ))}
          </div>
        )}

        {/* Deadline */}
        {task.deadline && (
          <div className={`flex items-center gap-1.5 mb-4 ${isOverdue ? 'text-red-700 bg-white/40 w-fit px-2 py-1 rounded-md -ml-2' : 'text-black/60 font-bold'}`}>
            <Calendar size={12} strokeWidth={2.5} />
            <span className="text-xs font-bold">
              {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {isOverdue && ' · Overdue'}
            </span>
          </div>
        )}

        {/* Bottom: Assignee & Date */}
        <div className="flex items-center justify-between pt-3 border-t border-black/10 mt-2">
          <div className="flex items-center gap-2">
            {task.assignees && task.assignees.length > 0 ? (
              <>
                <img
                  src={task.assignees[0].avatar || `https://ui-avatars.com/api/?name=${task.assignees[0].name}&size=32&background=ffffff&color=000000&bold=true`}
                  title={task.assignees[0].name}
                  className="w-7 h-7 rounded-full border-2 border-white/50 object-cover shadow-sm"
                  alt="avatar"
                />
                <span className="text-[12px] font-bold text-black/60 truncate max-w-[90px]">{task.assignees[0].name}</span>
              </>
            ) : (
              <span className="text-[12px] font-bold text-black/30 italic">Unassigned</span>
            )}
          </div>

          {task.date && (
            <span className="text-[10px] font-bold text-black/30 bg-black/5 px-2 py-1 rounded-md">{task.date}</span>
          )}
        </div>
      </div>
    </div>
  );
}
