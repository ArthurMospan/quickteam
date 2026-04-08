import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header.jsx';
import BottomNav from '../components/Sidebar.jsx';
import KanbanBoard from '../components/KanbanBoard.jsx';
import CreateTaskModal from '../components/CreateTaskModal.jsx';
import { useBoardStore } from '../store/boardStore';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { BarChart3, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function Board() {
  const { projectId } = useParams();
  const { tasks, columns, loading, fetchBoard, moveTask } = useBoardStore();
  const token = useAuthStore(state => state.token);
  const { projects, fetchProjects } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState('board');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [prioAlert, setPrioAlert] = useState(false);

  const prioWeights = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };

  useEffect(() => {
    if (projects.length === 0 && token) fetchProjects(token);
  }, [projects.length, fetchProjects, token]);

  const project = projects.find(p => p.id === projectId);
  const projectName = project?.name || 'Loading...';

  useEffect(() => {
    if (projectId && token) fetchBoard(projectId, token);
  }, [projectId, token, fetchBoard]);

  useEffect(() => {
    if (activeTab === 'analytics' && token && projectId) {
      setAnalyticsLoading(true);
      fetch(`http://localhost:3000/api/projects/${projectId}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(d => { setAnalyticsData(d); setAnalyticsLoading(false); })
        .catch(() => setAnalyticsLoading(false));
    }
  }, [activeTab, token, projectId]);

  const handleDragStart = (e, taskId) => {
    const draggedTask = tasks[taskId];
    if (draggedTask) {
      const draggedWeight = prioWeights[draggedTask.priority?.toLowerCase()] || 0;
      
      // Find highest priority on board
      let maxWeight = 0;
      Object.values(tasks).forEach(t => {
        const w = prioWeights[t.priority?.toLowerCase()] || 0;
        if (w > maxWeight) maxWeight = w;
      });

      if (draggedWeight < maxWeight) {
        setPrioAlert(true);
        setTimeout(() => setPrioAlert(false), 3000);
      }
    }
    e.dataTransfer.setData('taskId', taskId);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, colId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) moveTask(taskId, colId, token);
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateTask = async (taskData) => {
    await useBoardStore.getState().createTask({ ...taskData, projectId }, token);
    fetchBoard(projectId, token);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F4F2]">Loading...</div>;
  }

  return (
    <div className="h-screen bg-[#F4F4F2] font-sans text-[#1A1A1A] flex flex-col overflow-hidden">
      <Header 
        projectName={projectName} 
        projectId={projectId} 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'board' ? (
        <KanbanBoard 
          columns={columns} 
          tasks={tasks} 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          projectId={projectId}
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-8 pb-24 custom-scrollbar">
          {analyticsLoading || !analyticsData ? (
            <div className="flex items-center justify-center h-40 text-gray-400">Loading analytics...</div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-6 mb-8">
                <div className="bg-white p-6 rounded-[28px] text-center border border-gray-50">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Total Tasks</span>
                  <span className="text-4xl font-light text-gray-900">{analyticsData.total}</span>
                </div>
                <div className="bg-white p-6 rounded-[28px] shadow-sm text-center border border-gray-50">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Completed</span>
                  <span className="text-4xl font-light text-green-600">{analyticsData.completed}</span>
                </div>
                <div className="bg-white p-6 rounded-[28px] shadow-sm text-center border border-gray-50">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Completion Rate</span>
                  <span className="text-4xl font-light text-gray-900">{analyticsData.completionRate}%</span>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[28px] border border-gray-50">
                  <h2 className="text-lg font-bold mb-6">Tasks Velocity (7 Days)</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData.burnDown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                        <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                        <Line type="monotone" name="Total Created" dataKey="total" stroke="#1A1A1A" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                        <Line type="monotone" name="Completed" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[28px] border border-gray-50">
                  <h2 className="text-lg font-bold mb-6">Column Distribution</h2>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData.distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                        <Tooltip cursor={{fill: '#F4F4F2'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" name="Tasks" fill="#EBCBEE" radius={[8, 8, 8, 8]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <BottomNav onCreateClick={() => setIsCreateModalOpen(true)} />
      
      <CreateTaskModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={columns}
        onCreate={handleCreateTask}
        projectId={projectId}
        token={token}
      />

      {/* Priority Guard Alert */}
      {prioAlert && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-xl text-white px-8 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-black animate-bounce">
               <span className="font-bold text-xl">!</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">бро_ у тебе є важливіші справи</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">focus on priority tasks first</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
