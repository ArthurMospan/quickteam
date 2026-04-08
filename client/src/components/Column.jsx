import React, { useState } from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import TaskCard from './TaskCard.jsx';

export default function Column({ column, tasks, onDragOver, onDrop, onDragStart, onTaskClick, onRename, onDelete, onAddTask, isOwner = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  return (
    <div 
      className="w-[280px] flex flex-col gap-3"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
    >
      <div className="flex justify-between items-center px-1 mb-1 relative">
        {isEditing ? (
          <input 
            type="text"
            className="font-bold text-gray-900 bg-white border border-gray-200 rounded-xl px-3 py-1.5 flex-1 mr-2 focus:outline-none focus:border-black text-[14px]"
            value={title}
            autoFocus
            onChange={e => setTitle(e.target.value)}
            onBlur={() => { setIsEditing(false); if(title !== column.title) onRename(column.id, title); }}
            onKeyDown={e => { if(e.key === 'Enter') e.target.blur(); }}
          />
        ) : (
          <h2 className="font-bold text-gray-600 flex items-center gap-2 px-1 text-[13px] uppercase tracking-wider">
            {column.title} <span className="text-gray-400 font-medium text-xs bg-gray-100 px-2 py-0.5 rounded-full normal-case tracking-normal">{tasks.length}</span>
          </h2>
        )}
        
        <div className="flex items-center gap-1">
          {/* Add task inline — available to all */}
          <button 
            onClick={() => { setShowTaskInput(true); setTimeout(() => document.getElementById(`inline-input-${column.id}`)?.focus(), 10); }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
          >
            <Plus size={15} strokeWidth={2} />
          </button>

          {/* Column settings — only owners/admins */}
          {isOwner && (
            <>
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors"
              >
                <MoreHorizontal size={15} strokeWidth={2} />
              </button>
              
              {showMenu && (
                <div className="absolute top-10 right-0 w-44 bg-white rounded-2xl shadow-lg border border-gray-100 z-30 py-2 overflow-hidden">
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Rename Column</button>
                  <div className="h-px bg-gray-100 my-1 w-full" />
                  <button onClick={() => { if(window.confirm('Delete this column and all its tasks?')) { onDelete(column.id); } setShowMenu(false); }} className="w-full text-left px-5 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">Delete Column</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {tasks.map(task => (
        <TaskCard 
          key={task.id} 
          task={task} 
          onDragStart={onDragStart} 
          onClick={onTaskClick}
        />
      ))}

      {showTaskInput && (
        <div className="bg-white p-3 rounded-[16px] border border-gray-100 flex flex-col gap-2">
          <input 
            id={`inline-input-${column.id}`}
            type="text"
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            className="w-full text-sm font-medium focus:outline-none placeholder-gray-300"
            onKeyDown={async (e) => {
              if (e.key === 'Enter' && newTaskTitle.trim()) {
                await onAddTask(newTaskTitle.trim());
                setNewTaskTitle('');
                setShowTaskInput(false);
              } else if (e.key === 'Escape') {
                setNewTaskTitle('');
                setShowTaskInput(false);
              }
            }}
            onBlur={() => {
              if (!newTaskTitle.trim()) setShowTaskInput(false);
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-300 font-medium">↵ to add</span>
            <button 
              onMouseDown={async (e) => {
                e.preventDefault();
                if (newTaskTitle.trim()) {
                  await onAddTask(newTaskTitle.trim());
                  setNewTaskTitle('');
                  setShowTaskInput(false);
                }
              }}
              className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
