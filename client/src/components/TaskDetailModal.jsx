import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Activity, Save, Tag, Calendar, AlertCircle, Users, FolderKanban, Clock, Columns } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export default function TaskDetailModal({ task, isOpen, onClose, token, onUpdateTaskInStore, members = [] }) {
  const [activeTab, setActiveTab] = useState('comments');
  const [description, setDescription] = useState(task?.description || '');
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingDesc, setSavingDesc] = useState(false);

  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [deadline, setDeadline] = useState(task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || task?.assignees?.[0]?.id || null);
  const [type, setType] = useState(task?.type || 'Task');
  const [storyPoints, setStoryPoints] = useState(task?.storyPoints || '');

  const editor = useEditor({
    extensions: [StarterKit],
    content: task?.description || '',
    editorProps: {
      attributes: {
        class: 'w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-300 min-h-[140px] prose prose-sm max-w-none'
      }
    },
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    }
  });

  useEffect(() => {
    if (task && isOpen) {
      setDescription(task.description || '');
      setPriority(task.priority || 'Medium');
      setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
      setAssigneeId(task?.assigneeId || task?.assignees?.[0]?.id || null);
      setType(task.type || 'Task');
      setStoryPoints(task.storyPoints || '');
      
      if (editor && task.description !== editor.getHTML()) {
        editor.commands.setContent(task.description || '');
      }

      setLoading(true);
      fetch(`https://quickteam.onrender.com/api/tasks/${task.id}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || []);
        setActivities(data.activities || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [task, isOpen, token]);

  if (!isOpen || !task) return null;

  const handleSaveDetails = async (fieldToSave) => {
    if (fieldToSave === 'description') setSavingDesc(true);
    
    const payload = {
      description,
      priority,
      deadline: deadline || null,
      assigneeId,
      type,
      storyPoints: storyPoints === '' ? null : parseInt(storyPoints)
    };

    try {
      const res = await fetch(`https://quickteam.onrender.com/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const updatedTask = await res.json();
      if (onUpdateTaskInStore) {
        onUpdateTaskInStore(task.id, { 
          description: updatedTask.description,
          priority: updatedTask.priority,
          deadline: updatedTask.deadline,
          assigneeId: updatedTask.assigneeId,
          type: updatedTask.type,
          storyPoints: updatedTask.storyPoints,
          assignees: updatedTask.assignees?.map(a => a.user) || []
        });
      }
    } catch (err) {
      console.error(err);
    }
    if (fieldToSave === 'description') setSavingDesc(false);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`https://quickteam.onrender.com/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: newComment })
      });
      const commentData = await res.json();
      setComments([commentData, ...comments]);
      setNewComment('');
      
      setActivities([{
        id: 'temp-' + Date.now(),
        action: 'commented',
        details: 'Left a comment',
        user: commentData.user,
        createdAt: commentData.createdAt
      }, ...activities]);

    } catch (err) { }
  };

  const priorityColor = {
    'Critical': 'bg-red-100 text-red-700 border-red-200',
    'High': 'bg-orange-100 text-orange-700 border-orange-200',
    'Medium': 'bg-[#E0D4F5] text-purple-700 border-purple-200',
    'Low': 'bg-gray-100 text-gray-600 border-gray-200',
  };

  const stateLabel = task.colId || task.column?.title || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-[#F4F4F2] rounded-[28px] w-full max-w-5xl max-h-[90vh] shadow-xl relative flex flex-col overflow-hidden">
        
        {/* Header — compact */}
        <div className="bg-white px-8 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mb-1">
              {task.projectName && <span className="uppercase tracking-wider">{task.projectName}</span>}
              {task.projectName && <span>›</span>}
              <span className="font-bold text-black bg-gray-200 px-2 py-0.5 rounded-md mx-1">{task.taskKey || 'TASK'}</span>
              <span>{stateLabel}</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 truncate">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors ml-4 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex overflow-hidden bg-white">
          
          {/* Main Left Column (Description & Communication) */}
          <div className="flex-1 overflow-y-auto px-8 py-6 custom-scrollbar">
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Description</h3>
              <div className="relative">
                <EditorContent editor={editor} />
                {description !== (task.description || '') && (
                  <button 
                    onClick={() => handleSaveDetails('description')}
                    disabled={savingDesc}
                    className="absolute bottom-4 right-4 bg-black text-white px-4 py-2 rounded-full text-xs font-medium flex items-center gap-1 hover:bg-gray-800 transition-colors shadow-md disabled:opacity-70 z-10"
                  >
                    <Save size={14} /> {savingDesc ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Attachments</h3>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                  <p className="text-sm text-gray-500 font-medium group-hover:text-black transition-colors">Drag & drop files here to attach</p>
                  <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              </div>
            </div>
            <div className="min-h-[250px]">
              <div className="flex items-center gap-6 border-b border-gray-100 pb-3 mb-6">
                <button 
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-3 -mb-[13px] border-b-2 transition-colors ${activeTab === 'comments' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  <MessageSquare size={16} /> Comments
                </button>
                <button 
                  onClick={() => setActiveTab('activity')}
                  className={`flex items-center gap-2 text-sm font-semibold pb-3 -mb-[13px] border-b-2 transition-colors ${activeTab === 'activity' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                  <Activity size={16} /> Activity Log
                </button>
              </div>

              {loading ? (
                <div className="text-center text-sm text-gray-400 py-10">Loading timeline...</div>
              ) : activeTab === 'comments' ? (
                <div className="flex flex-col gap-6">
                  <form onSubmit={handlePostComment} className="flex gap-3 items-start">
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        className="w-full bg-gray-50 border border-gray-100 rounded-full px-5 py-3 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-black"
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                      />
                      <button type="submit" disabled={!newComment.trim()} className="absolute right-2 top-1.5 bg-black text-white p-1.5 rounded-full disabled:opacity-50">
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  </form>
                  <div className="flex flex-col gap-4">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-3">
                        <img src={c.user.avatar || `https://ui-avatars.com/api/?name=${c.user.name}`} alt={c.user.name} className="w-8 h-8 rounded-full border border-gray-100 object-cover mt-1" />
                        <div className="flex-1 bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="font-semibold text-sm">{c.user.name}</span>
                            <span className="text-[11px] text-gray-400">{new Date(c.createdAt).toLocaleString('uk-UA')}</span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-100 ml-4 pl-6 py-2 flex flex-col gap-6">
                  {activities.map(act => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[31px] bg-white border-2 border-gray-200 w-4 h-4 rounded-full mt-1"></div>
                      <p className="text-sm text-gray-800">
                        <span className="font-semibold">{act.user.name}</span> <span className="text-gray-500">{act.details}</span>
                      </p>
                      <span className="text-[11px] text-gray-400">{new Date(act.createdAt).toLocaleString('uk-UA')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar — YouTrack-style properties */}
          <div className="w-[280px] shrink-0 bg-[#FAFAF8] border-l border-gray-100 overflow-y-auto custom-scrollbar">
            <div className="p-6 flex flex-col gap-5">

              {/* Project */}
              {task.projectName && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Project</h4>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#E0D4F5] flex items-center justify-center">
                      <FolderKanban size={12} className="text-purple-700" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{task.projectName}</span>
                  </div>
                </div>
              )}

              {/* Priority */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Priority</h4>
                <select 
                  value={priority} 
                  onChange={(e) => {
                    setPriority(e.target.value);
                    setTimeout(() => handleSaveDetails('priority'), 0);
                  }}
                  className={`w-full text-sm font-semibold px-3 py-2 rounded-xl border focus:outline-none appearance-none cursor-pointer transition-colors ${priorityColor[priority] || priorityColor.Medium}`}
                >
                  <option value="Critical">🔴 Critical</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🟣 Medium</option>
                  <option value="Low">⚪ Low</option>
                </select>
              </div>

              {/* Task Type */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Type</h4>
                <select 
                  value={type} 
                  onChange={(e) => {
                    setType(e.target.value);
                    setTimeout(() => handleSaveDetails('type'), 0);
                  }}
                  className="w-full text-sm font-semibold px-3 py-2 rounded-xl border bg-white focus:outline-none appearance-none cursor-pointer transition-colors"
                >
                  <option value="Epic">🚀 Epic</option>
                  <option value="Task">☑️ Task</option>
                  <option value="Bug">🐛 Bug</option>
                  <option value="Subtask">📋 Subtask</option>
                </select>
              </div>

              {/* Story Points */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Estimation</h4>
                <input 
                  type="number"
                  placeholder="Story points (e.g. 5)"
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(e.target.value)}
                  onBlur={() => handleSaveDetails('storyPoints')}
                  className="w-full text-sm font-medium px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 focus:outline-none focus:border-black"
                />
              </div>

              {/* State / Column */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">State</h4>
                <div className="flex items-center gap-2">
                  <Columns size={14} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{stateLabel}</span>
                </div>
              </div>

              {/* Assignee */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Assignee</h4>
                {assigneeId && members.length > 0 ? (
                  (() => {
                    const assignee = members.find(m => m.id === assigneeId);
                    return assignee ? (
                      <div className="flex items-center gap-2">
                        <img src={assignee.avatar || `https://ui-avatars.com/api/?name=${assignee.name}`} className="w-7 h-7 rounded-full border border-gray-200" />
                        <span className="text-sm font-medium text-gray-900">{assignee.name}</span>
                      </div>
                    ) : <span className="text-sm text-gray-400 italic">Unassigned</span>;
                  })()
                ) : task.assignees?.length > 0 ? (
                  <div className="flex items-center gap-2">
                    <img src={task.assignees[0].avatar || `https://ui-avatars.com/api/?name=${task.assignees[0].name}`} className="w-7 h-7 rounded-full border border-gray-200" />
                    <span className="text-sm font-medium text-gray-900">{task.assignees[0].name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Unassigned</span>
                )}
                
                {members.length > 0 && (
                  <div className="mt-2 bg-white rounded-xl border border-gray-200 p-1.5 flex flex-col gap-0.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                    <label className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-500 italic">
                      <input type="radio" name="assignee" className="h-3.5 w-3.5" checked={!assigneeId} onChange={() => setAssigneeId(null)} />
                      Unassigned
                    </label>
                    {members.map(member => (
                      <label key={member.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <input type="radio" name="assignee" className="h-3.5 w-3.5" checked={assigneeId === member.id} onChange={() => setAssigneeId(member.id)} />
                        <img src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`} className="w-5 h-5 rounded-full" />
                        <span className="text-sm text-gray-700 font-medium truncate">{member.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <button 
                  onClick={() => handleSaveDetails('assignee')}
                  className="mt-2 w-full text-xs bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 py-1.5 rounded-lg transition-colors font-medium"
                >
                  Apply
                </button>
              </div>

              {/* Deadline */}
              <div>
                <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Deadline</h4>
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    setTimeout(() => handleSaveDetails('deadline'), 0);
                  }}
                  className="w-full text-sm font-medium px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 focus:outline-none focus:border-black cursor-pointer"
                />
              </div>

              {/* Created */}
              {task.createdAt && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Created</h4>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">{new Date(task.createdAt).toLocaleDateString('uk-UA')}</span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tags</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tt) => (
                      <span 
                        key={tt.id || tt.tag?.id} 
                        className="px-2.5 py-1 text-[10px] font-bold rounded-full text-white uppercase tracking-wider"
                        style={{ backgroundColor: tt.color || tt.tag?.color || '#999' }}
                      >
                        {tt.name || tt.tag?.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
