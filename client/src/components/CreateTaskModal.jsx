import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Users, FolderKanban } from 'lucide-react';

export default function CreateTaskModal({ isOpen, onClose, columns, members = [], projects = [], onCreate, isGlobal = false, token }) {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState('white');
  const [columnId, setColumnId] = useState('');
  const [assigneeIds, setAssigneeIds] = useState([]);
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectColumns, setProjectColumns] = useState([]);
  const [loadingCols, setLoadingCols] = useState(false);

  useEffect(() => {
    if (!isGlobal && columns && columns.length > 0 && !columnId) {
      setColumnId(columns[0].id);
    }
  }, [columns, columnId, isGlobal]);

  // When project is selected in global mode, load its columns
  useEffect(() => {
    if (isGlobal && selectedProjectId && token) {
      setLoadingCols(true);
      fetch(`https://quickteam.onrender.com/api/projects/${selectedProjectId}/board`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data.columns) {
            setProjectColumns(data.columns);
            setColumnId(data.columns[0]?.id || '');
          }
          setLoadingCols(false);
        })
        .catch(() => setLoadingCols(false));
    }
  }, [selectedProjectId, isGlobal, token]);

  // Auto-select first project in global mode
  useEffect(() => {
    if (isGlobal && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [isGlobal, projects, selectedProjectId]);

  if (!isOpen) return null;

  const activeCols = isGlobal ? projectColumns : columns;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !columnId) return;

    onCreate({ 
      title, 
      color: selectedColor, 
      columnId, 
      priority,
      deadline: deadline || null,
      assigneeIds 
    });
    
    setTitle('');
    setSelectedColor('white');
    setAssigneeIds([]);
    setPriority('Medium');
    setDeadline('');
    if (isGlobal) {
      setSelectedProjectId(projects[0]?.id || '');
    }
    onClose();
  };

  const colors = [
    { id: 'white', bg: 'bg-white', border: 'border-gray-200' },
    { id: 'purple', bg: 'bg-[#EBCBEE]', border: 'border-transparent' },
    { id: 'purple-light', bg: 'bg-[#E0D4F5]', border: 'border-transparent' },
    { id: 'yellow', bg: 'bg-[#EED148]', border: 'border-transparent' },
    { id: 'gray', bg: 'bg-[#EAEBE6]', border: 'border-transparent' }
  ];

  const toggleAssignee = (id) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#F4F4F2] rounded-[28px] w-full max-w-2xl shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-white px-8 py-6 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Create Task</h2>
            <p className="text-sm text-gray-400 mt-1">Add a new item to the pipeline</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
          <form id="create-task-form" onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Task Title</label>
              <input 
                type="text" 
                autoFocus
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-gray-900 focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400 text-sm"
                placeholder="E.g., Design new landing page..."
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            {/* Project selector (global mode only) */}
            {isGlobal && (
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><FolderKanban size={14} className="text-gray-400" /> Project</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer"
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-8">
              {/* Column Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Column</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black appearance-none cursor-pointer"
                  value={columnId}
                  onChange={e => setColumnId(e.target.value)}
                  disabled={loadingCols}
                >
                  {(loadingCols ? [] : activeCols).map(col => (
                    <option key={col.id} value={col.id}>{col.title}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><AlertCircle size={14} className="text-gray-400" /> Priority</label>
                <select 
                  value={priority} 
                  onChange={e => setPriority(e.target.value)}
                  className={`w-full text-sm font-medium px-5 py-3 rounded-2xl border focus:outline-none appearance-none cursor-pointer transition-colors ${
                    priority === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                    priority === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    priority === 'Medium' ? 'bg-[#EED148]/30 text-yellow-800 border-yellow-200' :
                    'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
               {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Card Color</label>
                <div className="flex items-center gap-3">
                  {colors.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-8 h-8 rounded-full ${c.bg} border-2 ${selectedColor === c.id ? 'border-gray-900 shadow-md transform scale-110' : c.border} transition-all`}
                    />
                  ))}
                </div>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><Calendar size={14} className="text-gray-400" /> Deadline</label>
                <input 
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                />
              </div>
            </div>

            {/* Assignees */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2"><Users size={14} className="text-gray-400" /> Assign To</label>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex gap-2 flex-wrap max-h-40 overflow-y-auto custom-scrollbar">
                {members.length === 0 ? (
                  <p className="text-xs text-gray-400 p-2">No team members available.</p>
                ) : (
                  members.map(member => {
                    const isSelected = assigneeIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleAssignee(member.id)}
                        className={`flex items-center gap-2 pr-3 pl-1 py-1 rounded-full border text-xs font-medium transition-colors ${
                          isSelected ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 shadow-sm'
                        }`}
                      >
                         <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} className="w-6 h-6 rounded-full object-cover bg-white" alt="avatar" />
                         {member.name.split(' ')[0]}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-white px-8 py-5 border-t border-gray-100 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-full text-sm font-semibold text-gray-500 hover:text-black hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="create-task-form" disabled={!title.trim() || !columnId} className="px-6 py-2.5 rounded-full text-sm font-semibold bg-black text-white disabled:opacity-50 hover:bg-gray-800 transition-colors shadow-sm">
            Create Task
          </button>
        </div>

      </div>
    </div>
  );
}
