import React, { useState } from 'react';
import Column from './Column.jsx';
import { Plus } from 'lucide-react';
import TaskDetailModal from './TaskDetailModal.jsx';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';

export default function KanbanBoard({ columns, tasks, onDragStart, onDragOver, onDrop, projectId }) {
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterMine, setFilterMine] = useState(false);
  const [filterBugs, setFilterBugs] = useState(false);
  
  const { createTask, updateTask, members, createColumn, renameColumn, deleteColumn, fetchBoard, searchQuery } = useBoardStore();
  const { token, user } = useAuthStore();

  // Dynamically check if the current user is an admin or owner of the workspace
  const currentMember = members.find(m => m.id === user?.id);
  const isOwner = currentMember?.role === 'ADMIN' || currentMember?.role === 'MANAGER' || user?.email === 'admin@quickteam.com'; // Fallback for system admin

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleUpdateTaskInStore = (taskId, updates) => {
    updateTask(taskId, updates);
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto overflow-y-auto px-8 pb-20 custom-scrollbar relative z-0 flex flex-col">
        {/* Filters */}
        <div className="flex items-center gap-3 py-4 sticky left-0 shrink-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">Filters:</span>
          <button 
            onClick={() => setFilterMine(!filterMine)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterMine ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            Only my tasks
          </button>
          <button 
            onClick={() => setFilterBugs(!filterBugs)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterBugs ? 'bg-red-100 text-red-700 border-red-200 border' : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50'}`}
          >
            🐛 Bugs
          </button>
        </div>

        <div className="flex gap-5 min-w-max pb-10 pt-1 flex-1">
          {columns.map(column => {
            const columnTasks = Object.values(tasks)
              .filter(task => task.colId === column.id)
              .filter(task => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase().trim()))
              .filter(task => !filterMine || task.assigneeId === user?.id || task.assignees?.some(a => a.id === user?.id))
              .filter(task => !filterBugs || task.type === 'Bug');
            return (
              <Column 
                key={column.id} 
                column={column} 
                tasks={columnTasks}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
                onTaskClick={handleTaskClick}
                onRename={(colId, newTitle) => renameColumn(projectId, colId, newTitle, token)}
                onDelete={(colId) => deleteColumn(projectId, colId, token)}
                onAddTask={async (title) => {
                  await createTask({ title, columnId: column.id, projectId }, token);
                  fetchBoard(projectId, token);
                }}
                wipLimit={column.wipLimit}
                isOwner={isOwner}
              />
            )
          })}

          {/* Add Column Button — owners only */}
          {isOwner && (
            <div className="w-[200px] shrink-0 flex flex-col gap-3 pt-1">
              <button 
                onClick={() => {
                  const title = window.prompt('Enter new column name:');
                  if (title && title.trim()) {
                    createColumn(projectId, title, token);
                  }
                }}
                className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition-colors text-[13px] font-semibold"
              >
                <Plus size={14} /> Add column
              </button>
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        token={token}
        members={members}
        onUpdateTaskInStore={handleUpdateTaskInStore}
      />
    </>
  );
}
