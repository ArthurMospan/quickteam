import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { User, Mail, Shield, Save, KeyRound, AlertCircle, Layout, Check, X, GripVertical, Globe } from 'lucide-react';

export default function Settings() {
  const { user, token, updateProfile } = useAuthStore();
  const { projects, fetchProjects } = useWorkspaceStore();
  
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'columns'
  
  // Profile Form State
  const [formData, setFormData] = useState({ name: '', email: '', language: 'en' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Columns Form State
  const [workspaceId, setWorkspaceId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [newColumn, setNewColumn] = useState('');
  const [colLoading, setColLoading] = useState(false);
  const [colMsg, setColMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name, email: user.email, language: user.language || 'en' });
      // Fetch user's workspace to get default columns
      fetch('http://localhost:3000/api/workspaces', { headers: { 'Authorization': `Bearer ${token}` }})
        .then(r => r.json())
        .then(wsList => {
          if (wsList && wsList.length > 0) {
            const ws = wsList[0];
            setWorkspaceId(ws.id);
            setColumns(ws.defaultColumns ? JSON.parse(ws.defaultColumns) : ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']);
          }
        })
        .catch(err => console.error(err));
    }
    if (projects.length === 0 && token) fetchProjects(token);
  }, [user, projects.length, fetchProjects, token]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg({ type: '', text: '' });
    
    const res = await updateProfile(token, formData);
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } else {
      setProfileMsg({ type: 'error', text: res.error });
    }
    setProfileLoading(false);
    setTimeout(() => setProfileMsg({ type: '', text: '' }), 3000);
  };

  const saveColumns = async () => {
    if (!workspaceId) return;
    setColLoading(true);
    setColMsg({ type: '', text: '' });
    try {
      const res = await fetch(`http://localhost:3000/api/workspaces/${workspaceId}/columns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ defaultColumns: columns })
      });
      if (!res.ok) throw new Error('Failed to update columns');
      setColMsg({ type: 'success', text: 'Default columns updated! New projects will use this structure.' });
    } catch (err) {
      setColMsg({ type: 'error', text: err.message });
    }
    setColLoading(false);
    setTimeout(() => setColMsg({ type: '', text: '' }), 4000);
  };

  const addColumn = () => {
    if (newColumn.trim()) {
      setColumns([...columns, newColumn.trim()]);
      setNewColumn('');
    }
  };

  const removeColumn = (idx) => {
    setColumns(columns.filter((_, i) => i !== idx));
  };

  // Simple array move for reordering later if needed
  const moveColumn = (idx, direction) => {
    if (idx === 0 && direction === -1) return;
    if (idx === columns.length - 1 && direction === 1) return;
    const newCols = [...columns];
    const temp = newCols[idx];
    newCols[idx] = newCols[idx + direction];
    newCols[idx + direction] = temp;
    setColumns(newCols);
  };

  return (
    <div className="min-h-screen bg-[#F4F4F2] font-sans text-[#1A1A1A]">
      <Header />
      <main className="max-w-4xl mx-auto px-8 py-10 pb-28">
        <header className="mb-8 flex items-end justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
              <User size={24} className="text-black" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">Configuration</p>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-200/50 p-1.5 rounded-full w-fit">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Profile
          </button>
          <button 
            onClick={() => setActiveTab('columns')}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'columns' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            Global Columns
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="bg-white p-8 rounded-[28px] shadow-sm border border-gray-50">
              <h2 className="text-2xl font-bold mb-6">Personal Information</h2>

              {profileMsg.text && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {profileMsg.type === 'error' && <AlertCircle size={16} />}
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="flex flex-col gap-6">
                <div className="flex items-center gap-6 mb-2">
                  <img 
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=EBCBEE&color=1A1A1A&bold=true`} 
                    alt="Avatar" 
                    className="w-20 h-20 rounded-full border-4 border-gray-50 shadow-sm"
                  />
                  <div>
                    <p className="text-sm text-gray-400 font-medium mb-1">Profile Picture</p>
                    <p className="text-xs text-gray-500 max-w-xs">Auto-generated based on your name.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><User size={14} className="text-gray-400" /> Full Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><Mail size={14} className="text-gray-400" /> Email Address</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2"><Globe size={14} className="text-gray-400" /> Display Language</label>
                    <select 
                      value={formData.language} 
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors"
                    >
                      <option value="en">English (US)</option>
                      <option value="uk">Ukrainian (Українська)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button type="submit" disabled={profileLoading || (formData.name === user?.name && formData.email === user?.email && formData.language === user?.language)}
                    className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm">
                    <Save size={16} /> {profileLoading ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </form>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <section className="bg-white p-8 rounded-[28px] shadow-sm border border-gray-50">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Shield size={20} className="text-gray-400" /> Security</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">Your account is secured with standard encryption.</p>
                <button disabled className="w-full bg-gray-50 border border-gray-200 text-gray-400 px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed">
                  <KeyRound size={16} /> Change Password (Soon)
                </button>
              </section>

              <section className="bg-white p-8 rounded-[28px] shadow-sm border border-gray-50">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3"><img src="/logo.png" className="w-6 h-6 rounded-md shadow-sm" alt="logo" /> Your Projects</h2>
                {projects.length === 0 ? (
                  <p className="text-sm text-gray-500">You don't have any projects yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {projects.map(p => (
                      <li key={p.id} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="font-bold text-sm text-gray-900">{p.name}</span>
                        <span className="text-[10px] font-bold tracking-wider uppercase bg-[#E0D4F5] text-purple-700 px-2.5 py-1 rounded-full">Kanban</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}

        {activeTab === 'columns' && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <section className="bg-white p-8 rounded-[28px] shadow-sm border border-gray-50">
               <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                 <Layout className="text-purple-500" /> Workspace Columns
               </h2>
               <p className="text-sm text-gray-500 mb-8 max-w-xl leading-relaxed">
                 Define the default board columns for all **new** projects created in this workspace. Existing projects will not be affected to prevent data loss.
               </p>

               {colMsg.text && (
                 <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${colMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                   {colMsg.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                   {colMsg.text}
                 </div>
               )}

               <div className="flex flex-col gap-3 mb-6">
                 {columns.map((col, idx) => (
                   <div key={idx} className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-3 rounded-xl group hover:border-gray-300 transition-colors">
                     <div className="text-gray-300 group-hover:text-gray-500 cursor-grab flex flex-col gap-1 items-center justify-center">
                       <button onClick={() => moveColumn(idx, -1)} disabled={idx === 0} className="hover:text-black disabled:opacity-30 disabled:hover:text-gray-300">↑</button>
                       <button onClick={() => moveColumn(idx, 1)} disabled={idx === columns.length - 1} className="hover:text-black disabled:opacity-30 disabled:hover:text-gray-300">↓</button>
                     </div>
                     <span className="flex-1 font-bold text-sm text-gray-800">{col}</span>
                     <button 
                       onClick={() => removeColumn(idx)}
                       className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                       <X size={16} />
                     </button>
                   </div>
                 ))}

                 {columns.length === 0 && (
                   <div className="p-4 text-center border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm font-medium">
                     No columns defined. Projects will be created completely empty.
                   </div>
                 )}
               </div>

               <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                 <input 
                   type="text"
                   value={newColumn}
                   onChange={e => setNewColumn(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && addColumn()}
                   placeholder="E.g. Code Review"
                   className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors"
                 />
                 <button 
                   onClick={addColumn}
                   disabled={!newColumn.trim()}
                   className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 transition-colors"
                 >
                   Add Stage
                 </button>
               </div>

               <div className="flex justify-end mt-10">
                 <button 
                   onClick={saveColumns} 
                   disabled={colLoading || !workspaceId}
                   className="bg-black text-white px-8 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
                 >
                   <Save size={16} /> {colLoading ? 'Saving...' : 'Save Default Columns'}
                 </button>
               </div>

            </section>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
