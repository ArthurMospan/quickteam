import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/Sidebar';
import Column from '../components/Column';
import CreateTaskModal from '../components/CreateTaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { useBoardStore } from '../store/boardStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { Plus, Filter, Layers, X } from 'lucide-react';

export default function GlobalKanban() {
  const token = useAuthStore(state => state.token);
  const { columns, tasks, loading, fetchGlobalBoard, availableProjects, searchQuery, setSearchQuery, filterProject, setFilterProject, filterPriority, setFilterPriority, createTask, updateTask, moveTask } = useBoardStore();
  const { projects, fetchProjects } = useWorkspaceStore();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (token) {
      fetchGlobalBoard(token);
      fetchProjects(token);
    }
  }, [token, fetchGlobalBoard, fetchProjects]);

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, virtualColId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    const task = tasks[taskId];
    if (!task) return;

    // Find the virtual column to get its real DB column IDs
    const virtualCol = columns.find(c => c.id === virtualColId);
    if (!virtualCol || !virtualCol.columnIds?.length) {
      // Fallback: if it's a real column ID just use it directly
      moveTask(taskId, virtualColId, token);
    } else {
      // Find the real column belonging to the same project as this task
      // Since we don't have a direct project→columnId mapping here,
      // use the task's current real column to figure out the project's columns
      // Best effort: use the first columnId (works for single-project setup)
      const realColId = virtualCol.columnIds[0];
      moveTask(taskId, realColId, token);
    }
    setTimeout(() => fetchGlobalBoard(token), 500);
  };

  const handleCreateTask = async (taskData) => {
    await createTask(taskData, token);
    // Refresh global board
    fetchGlobalBoard(token);
  };

  // Filter tasks
  const filteredTasks = {};
  Object.entries(tasks).forEach(([id, task]) => {
    let show = true;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase().trim())) show = false;
    if (filterProject && task.projectId !== filterProject) show = false;
    if (filterPriority && task.priority !== filterPriority) show = false;
    if (show) filteredTasks[id] = task;
  });

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F4F2] text-[#1A1A1A]">Loading...</div>;
  }

  return (
    <div className="h-screen bg-[#F4F4F2] font-sans text-[#1A1A1A] flex flex-col overflow-hidden">
      <Header />
      
      {/* Subheader with filters */}
      <div className="px-8 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">All Tasks</h1>
            <p className="text-xs text-gray-400 font-medium">{Object.keys(filteredTasks).length} tasks across {availableProjects.length} projects</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border ${
                showFilters || filterProject || filterPriority
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-400 border-gray-100 hover:border-black hover:text-black'
              }`}
              title="Toggle Filters"
            >
              {showFilters ? <X size={18} /> : <Filter size={18} />}
            </button>

            {showFilters && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <div className="relative">
                  <select 
                    value={filterProject} 
                    onChange={e => setFilterProject(e.target.value)}
                    className="appearance-none bg-white border border-gray-100 text-xs font-bold uppercase tracking-wider rounded-full px-4 py-2 pr-8 focus:outline-none focus:border-black cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <option value="">All Projects</option>
                    {availableProjects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Plus size={10} className="rotate-45" />
                  </div>
                </div>

                <div className="relative">
                  <select 
                    value={filterPriority} 
                    onChange={e => setFilterPriority(e.target.value)}
                    className="appearance-none bg-white border border-gray-100 text-xs font-bold uppercase tracking-wider rounded-full px-4 py-2 pr-8 focus:outline-none focus:border-black cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <option value="">All Priorities</option>
                    <option value="Critical">🔴 Critical</option>
                    <option value="High">🟠 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">⚪ Low</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <Plus size={10} className="rotate-45" />
                  </div>
                </div>

                {(filterProject || filterPriority) && (
                  <button 
                    onClick={() => { setFilterProject(''); setFilterPriority(''); }}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 px-2 py-1 uppercase tracking-widest"
                  >
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-auto px-8 pb-24 custom-scrollbar relative z-0">
        <div className="flex gap-5 min-w-max pb-10 pt-4">
          {columns.map(column => {
            const columnTasks = Object.values(filteredTasks)
              .filter(task => task.colId === column.id || task.colId === column.title);
            return (
              <Column 
                key={column.id} 
                column={column} 
                tasks={columnTasks}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onTaskClick={(task) => setSelectedTask(task)}
                isGlobal={true}
              />
            );
          })}
        </div>
      </div>

      <BottomNav onCreateClick={() => setIsCreateModalOpen(true)} />

      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={columns}
        members={[]}
        projects={projects}
        onCreate={handleCreateTask}
        isGlobal={true}
        token={token}
      />
      
      <TaskDetailModal 
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        token={token}
        members={[]}
        onUpdateTaskInStore={(id, updates) => updateTask(id, updates)}
      />
    </div>
  );
}
