import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ArrowLeft, BarChart3, PieChart } from 'lucide-react';
import Sidebar from '../components/Sidebar.jsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export default function Analytics() {
  const { projectId } = useParams();
  const token = useAuthStore(state => state.token);
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaces.length === 0 && token) fetchWorkspaces(token);
  }, [workspaces.length, fetchWorkspaces, token]);

  useEffect(() => {
    fetch(`https://quickteam.onrender.com/api/projects/${projectId}/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(d => {
      setData(d);
      setLoading(false);
    })
    .catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, [projectId, token]);

  let projectName = 'Loading...';
  let workspaceName = 'Workspace';
  if (workspaces.length > 0) {
    for (const ws of workspaces) {
      const proj = ws.projects.find(p => p.id === projectId);
      if (proj) {
        projectName = proj.name;
        workspaceName = ws.name;
        break;
      }
    }
  }

  if (loading || !data) {
    return <div className="flex h-screen items-center justify-center bg-[#F4F4F2] text-[#1A1A1A]">Loading Analytics...</div>;
  }

  return (
    <div className="flex h-screen bg-[#F4F4F2] font-sans overflow-hidden text-[#1A1A1A]">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="pt-8 px-10 pb-4 shrink-0">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-2">
              <img src="/logo.png" className="w-7 h-7 rounded-lg shadow-sm" alt="logo" />
              <span className="font-bold text-xl tracking-tight">{workspaceName}</span>
            </div>
          </div>
          <div className="flex justify-between items-end mb-6">
            <div className="flex items-center gap-4">
              <Link to={`/project/${projectId}`} className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center text-gray-500 hover:bg-white transition-colors">
                <ArrowLeft size={20} strokeWidth={1.5} />
              </Link>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Project Reports</p>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{projectName} Analytics</h1>
              </div>
            </div>
            <div className="flex items-center gap-12 mr-10">
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Total Tasks</span>
                <span className="text-3xl font-light text-gray-900">{data.total}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Completed</span>
                <span className="text-3xl font-light text-green-600">{data.completed}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Completion Rate</span>
                <span className="text-3xl font-light text-gray-900">{data.completionRate}%</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 pb-20 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
            
            {/* Burndown Chart */}
            <div className="bg-white p-8 rounded-[28px] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#E0D4F5] flex items-center justify-center text-purple-600"><BarChart3 size={20} /></div>
                <h2 className="text-xl font-bold">Tasks Velocity (7 Days)</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.burnDown} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                    <Tooltip cursor={{stroke: '#E5E7EB', strokeWidth: 2}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}} />
                    <Line type="monotone" name="Total Created" dataKey="total" stroke="#1A1A1A" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                    <Line type="monotone" name="Completed" dataKey="completed" stroke="#10B981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="bg-white p-8 rounded-[28px] shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#EED148] flex items-center justify-center text-yellow-700"><PieChart size={20} /></div>
                <h2 className="text-xl font-bold">Column Distribution</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distribution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} />
                    <Tooltip cursor={{fill: '#F4F4F2'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Bar dataKey="count" name="Tasks in Column" fill="#EBCBEE" radius={[8, 8, 8, 8]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
