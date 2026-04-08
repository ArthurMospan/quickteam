import React, { useState } from 'react';
import Column from './Column.jsx';
import { Plus } from 'lucide-react';
import TaskDetailModal from './TaskDetailModal.jsx';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';

export default function KanbanBoard({ columns, tasks, onDragStart, onDragOver, onDrop, projectId }) {
  const [selectedTask, setSelectedTask] = useState(null);
  
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
      <div className="flex-1 overflow-x-auto overflow-y-auto px-8 pb-20 custom-scrollbar relative z-0">
        <div className="flex gap-5 min-w-max pb-10 pt-5">
          {columns.map(column => {
            const columnTasks = Object.values(tasks)
              .filter(task => task.colId === column.id)
              .filter(task => !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase().trim()));
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
