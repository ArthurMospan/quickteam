import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/Sidebar';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { Activity, TrendingUp, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const PRIORITY_COLORS = { Critical: '#EF4444', High: '#F59E0B', Medium: '#8B5CF6', Low: '#94A3B8' };

const StatCard = ({ label, value, sub, accent }) => (
  <div className="bg-white rounded-[24px] p-6 border border-gray-100 flex flex-col gap-1">
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    <span className={`text-4xl font-light ${accent || 'text-gray-900'}`}>{value}</span>
    {sub && <span className="text-xs text-gray-400 font-medium">{sub}</span>}
  </div>
);

export default function GlobalAnalytics() {
  const token = useAuthStore(state => state.token);
  const { projects, fetchProjects } = useWorkspaceStore();
  const [allData, setAllData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeProject, setActiveProject] = useState('all');

  useEffect(() => {
    if (projects.length === 0 && token) fetchProjects(token);
  }, [projects.length, fetchProjects, token]);

  useEffect(() => {
    if (projects.length > 0 && token) {
      Promise.all(
        projects.map(p =>
          fetch(`https://quickteam.onrender.com/api/projects/${p.id}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()).then(d => ({ ...d, projectName: p.name, projectId: p.id }))
        )
      ).then(results => {
        const total = results.reduce((s, r) => s + r.total, 0);
        const completed = results.reduce((s, r) => s + r.completed, 0);
        const completionRate = total ? Math.round((completed / total) * 100) : 0;
        const inProgress = total - completed;

        const projectBreakdown = results.map(r => ({
          name: r.projectName,
          id: r.projectId,
          total: r.total,
          completed: r.completed,
          inProgress: r.total - r.completed,
          rate: r.total ? Math.round((r.completed / r.total) * 100) : 0,
          distribution: r.distribution || [],
          burnDown: r.burnDown || []
        }));

        // Aggregate column distribution across all projects
        const colMap = {};
        results.forEach(r => {
          (r.distribution || []).forEach(col => {
            colMap[col.name] = (colMap[col.name] || 0) + col.count;
          });
        });
        const colDistribution = Object.entries(colMap).map(([name, count]) => ({ name, count }));

        // Aggregate burndown across all projects
        const burnMap = {};
        results.forEach(r => {
          (r.burnDown || []).forEach(d => {
            if (!burnMap[d.date]) burnMap[d.date] = { date: d.date, total: 0, completed: 0 };
            burnMap[d.date].total += d.total;
            burnMap[d.date].completed += d.completed;
          });
        });
        const burnDown = Object.values(burnMap).sort((a, b) => a.date.localeCompare(b.date));

        setAllData({ total, completed, inProgress, completionRate, projectBreakdown, colDistribution, burnDown });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [projects, token]);

  const displayedProject = activeProject === 'all' ? null : allData?.projectBreakdown.find(p => p.id === activeProject);
  const displayedBurnDown = displayedProject ? displayedProject.burnDown : allData?.burnDown;
  const displayedColDist = displayedProject ? displayedProject.distribution : allData?.colDistribution;

  return (
    <div className="min-h-screen bg-[#F4F4F2] font-sans text-[#1A1A1A]">
      <Header />
      <main className="max-w-6xl mx-auto px-8 py-10 pb-28">
        <header className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Overview</p>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          </div>
          {/* Project Switcher */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button 
              onClick={() => setActiveProject('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeProject === 'all' ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-black'}`}
            >
              All Projects
            </button>
            {allData?.projectBreakdown.map(p => (
              <button 
                key={p.id}
                onClick={() => setActiveProject(p.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeProject === p.id ? 'bg-black text-white' : 'bg-white text-gray-500 border border-gray-100 hover:border-black'}`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </header>

        {loading || !allData ? (
          <div className="flex items-center justify-center h-40">
            <Activity className="animate-spin text-gray-400" size={32} />
          </div>
        ) : (
          <>
            {/* Top Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard label="Total Tasks" value={activeProject === 'all' ? allData.total : (displayedProject?.total ?? '—')} />
              <StatCard label="Completed" value={activeProject === 'all' ? allData.completed : (displayedProject?.completed ?? '—')} accent="text-emerald-600" />
              <StatCard label="In Progress" value={activeProject === 'all' ? allData.inProgress : (displayedProject?.inProgress ?? '—')} accent="text-violet-600" />
              <StatCard label="Completion Rate" value={`${activeProject === 'all' ? allData.completionRate : (displayedProject?.rate ?? 0)}%`} sub="of all tasks done" />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              {/* Burndown / Activity Chart */}
              <div className="bg-white p-7 rounded-[24px] border border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Task Activity (Last 7 Days)</h2>
                <p className="text-xs text-gray-400 mb-5">Tasks created vs. completed over time</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayedBurnDown || []} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                      <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: '12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
                      <Line type="monotone" dataKey="total" name="Created" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} />
                      <Line type="monotone" dataKey="completed" name="Completed" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Column Distribution Donut */}
              <div className="bg-white p-7 rounded-[24px] border border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Status Distribution</h2>
                <p className="text-xs text-gray-400 mb-5">Tasks by column / stage</p>
                <div className="h-56 flex items-center gap-6">
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie data={displayedColDist || []} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {(displayedColDist || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-2">
                    {(displayedColDist || []).map((col, i) => (
                      <div key={col.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                        <span className="text-xs text-gray-600 font-medium truncate max-w-[100px]">{col.name}</span>
                        <span className="text-xs font-bold text-gray-900 ml-auto">{col.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Projects Overview Bar */}
            {activeProject === 'all' && (
              <div className="bg-white p-7 rounded-[24px] border border-gray-100 mb-6">
                <h2 className="text-sm font-bold text-gray-900 mb-1">Projects Overview</h2>
                <p className="text-xs text-gray-400 mb-5">Total vs. completed tasks per project</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allData.projectBreakdown} margin={{ top: 5, right: 20, bottom: 5, left: -15 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} dy={8} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <Tooltip contentStyle={{ borderRadius: '14px', border: 'none', fontSize: '12px' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '16px' }} />
                      <Bar dataKey="total" name="Total" fill="#EDE9FE" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Per-Project cards with mini progress */}
            {activeProject === 'all' && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {allData.projectBreakdown.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveProject(p.id)}
                    className="bg-white p-6 rounded-[24px] border border-gray-100 cursor-pointer hover:border-gray-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-bold text-base text-gray-900">{p.name}</h3>
                      <span className="text-xs font-bold text-gray-400">{p.rate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${p.rate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span><span className="font-bold text-gray-900">{p.completed}</span> done</span>
                      <span><span className="font-bold text-gray-900">{p.inProgress}</span> in progress</span>
                      <span><span className="font-bold text-gray-900">{p.total}</span> total</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
