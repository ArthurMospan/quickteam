import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import BottomNav from '../components/Sidebar';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { FolderKanban, Plus, MoreVertical, LayoutTemplate, X } from 'lucide-react';

export default function Projects() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { projects, fetchProjects, createProject } = useWorkspaceStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) fetchProjects(token);
  }, [token, fetchProjects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setLoading(true);
    try {
      const newProject = await createProject(token, projectName);
      setProjectName('');
      setIsModalOpen(false);
      if (newProject?.id) navigate(`/project/${newProject.id}`);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const colors = ['bg-[#EBCBEE]', 'bg-[#E0D4F5]', 'bg-[#EED148]', 'bg-[#EAEBE6]'];

  return (
    <div className="min-h-screen bg-[#F4F4F2] font-sans text-[#1A1A1A]">
      <Header />
      <main className="max-w-6xl mx-auto px-8 py-10 pb-28">
        <header className="mb-10 flex justify-between items-end shrink-0">
            <div>
              <p className="text-gray-400 text-xs font-bold mb-2 uppercase tracking-wider">Workspace</p>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-sm text-gray-400 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Project
          </button>
        </header>

        {projects.length === 0 ? (
          <div className="bg-white p-16 rounded-[28px] text-center flex flex-col items-center justify-center shadow-sm max-w-xl mx-auto mt-10 border border-gray-50">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <LayoutTemplate size={32} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6">Create your first project board to start organizing tasks.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, idx) => {
              const accentColors = ['bg-[#EBCBEE]', 'bg-[#E0D4F5]', 'bg-[#EED148]', 'bg-[#EAEBE6]', 'bg-[#F2D1D9]'];
              const accent = accentColors[idx % accentColors.length];
              return (
                <div 
                  key={project.id} 
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="bg-white rounded-[24px] hover:bg-gray-50 transition-all cursor-pointer border border-gray-100 group overflow-hidden flex flex-col"
                >
                  {/* Accent strip */}
                  <div className={`h-2 ${accent}`}></div>
                  <div className="p-6 flex-1 flex flex-col h-full">
                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-black transition-colors">{project.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">Kanban Board</p>

                    <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <img 
                           src={project.creator?.avatar || `https://ui-avatars.com/api/?name=${project.creator?.name || 'A'}&background=EBCBEE&color=1A1A1A`} 
                           alt="Creator" 
                           className="w-6 h-6 rounded-full"
                         />
                         <span className="text-xs font-medium text-gray-500">Created by {project.creator?.name || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[28px] w-full max-w-md relative flex flex-col overflow-hidden border border-gray-100">
            <div className="px-8 py-6 flex items-start justify-between border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">New Project</h2>
                <p className="text-sm text-gray-500">Create a new Kanban board.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 flex flex-col gap-6">
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Project Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors"
                  placeholder="e.g. Frontend Redesign"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !projectName.trim()}
                className="w-full bg-black text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
