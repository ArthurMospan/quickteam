import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BottomNav from '../components/Sidebar';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import { UserPlus, Mail, MoreHorizontal, Phone, MessageSquare, Briefcase, ArrowUpRight, Link as LinkIcon, AlertCircle, X, MapPin } from 'lucide-react';

export default function Team() {
  const { token, user: currentUser } = useAuthStore();
  const { members, fetchProjects, inviteMember, updateMemberRole, removeMember } = useWorkspaceStore();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (token) fetchProjects(token);
  }, [token, fetchProjects]);

  // Deduplicate members by userId
  const uniqueMembers = [];
  const seenUserIds = new Set();
  members.forEach(m => {
    if (!seenUserIds.has(m.userId)) {
      seenUserIds.add(m.userId);
      uniqueMembers.push(m);
    }
  });

  // Select first user automatically if none selected
  useEffect(() => {
    if (uniqueMembers.length > 0 && !selectedUser) {
      setSelectedUser(uniqueMembers[0]);
    }
  }, [uniqueMembers, selectedUser]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviteLoading(true);
    setInviteError('');
    
    const res = await inviteMember(token, inviteEmail, inviteRole);
    if (res.success) {
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('MEMBER');
      fetchProjects(token);
    } else {
      setInviteError(res.error);
    }
    setInviteLoading(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    await updateMemberRole(token, memberId, newRole);
    fetchProjects(token); // Refresh
  };

  const handleRemove = async (memberId) => {
    if (window.confirm("Remove this member from the team?")) {
      await removeMember(token, memberId);
      // If removed user was selected, clear selection
      if (selectedUser?.id === memberId) setSelectedUser(null);
      fetchProjects(token);
    }
  };

  const getPriorityColor = (role) => {
    if (role === 'ADMIN') return 'bg-[#ea4335]/20 text-[#ea4335]';
    if (role === 'MANAGER') return 'bg-[#fbbc04]/20 text-[#fbbc04]';
    return 'bg-[#4285f4]/20 text-[#4285f4]';
  };

  const userCardColors = [
    'bg-[#ccff00]', // vivid lime
    'bg-[#ff99cc]', // vivid pink
    'bg-[#66ccff]', // vivid blue
    'bg-[#ffcc00]', // vivid yellow/orange
    'bg-[#cc99ff]', // vivid purple
    'bg-[#00ffcc]', // vivid teal
  ];

  return (
    <div className="min-h-screen bg-[#F4F4F2] font-sans text-[#1A1A1A] flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 pb-28 mb-10 overflow-hidden">
        
        {/* Main Reference Layout Container */}
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          
          {/* LEFT: Dark Sidebar */}
          <div className="w-80 bg-[#111111] text-white flex flex-col shrink-0">
            {/* Dark Sidebar Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div className="w-10 h-10 bg-[#ccff00] rounded-xl flex items-center justify-center">
                  <span className="text-black font-extrabold text-xl leading-none">*</span>
                </div>
                <button 
                  onClick={() => setIsInviteOpen(true)}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-colors"
                >
                  <UserPlus size={18} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-white/50 text-xs font-medium mb-1 truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-[#ccff00]"></span> Team
                  </p>
                  <p className="text-2xl font-light text-right">{uniqueMembers.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-white/50 text-xs font-medium mb-1 truncate flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm bg-purple-400"></span> Projects
                  </p>
                  <p className="text-2xl font-light text-right">3</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 font-medium text-sm">Worklist</h3>
                <span className="text-white/40"><ArrowUpRight size={14} /></span>
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 no-scrollbar">
              {uniqueMembers.map((member, idx) => {
                const isSelected = selectedUser?.id === member.id;
                const cardBg = userCardColors[idx % userCardColors.length];
                
                return (
                  <div 
                    key={member.id}
                    onClick={() => setSelectedUser(member)}
                    className={`relative p-4 rounded-3xl cursor-pointer transition-all duration-300 transform ${cardBg} text-black ${
                      isSelected ? 'ring-4 ring-white shadow-xl scale-100 z-10' : 'opacity-70 hover:opacity-100 hover:scale-[1.02] scale-95'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <img 
                        src={member.user?.avatar || `https://ui-avatars.com/api/?name=${member.user?.name}&background=ffffff&color=000000`} 
                        alt={member.user?.name} 
                        className="w-10 h-10 rounded-full object-cover border-2 border-black/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{member.user?.name} {member.userId === currentUser?.id && '(You)'}</h4>
                        <p className="text-xs truncate text-black/60 font-medium">
                          {member.role.toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      <span className="opacity-50 text-black"><ArrowUpRight size={14} /></span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-black/70">
                        <Mail size={12} /> Email Contact
                      </div>
                      <div className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-black/10 text-black">
                        {member.role}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Detailed Content Area */}
          <div className="flex-1 bg-white flex flex-col relative overflow-hidden">
            {selectedUser ? (
              <>
                {/* Header Actions */}
                <div className="absolute top-6 right-8 flex items-center gap-3 z-10">
                  <button className="w-12 h-12 bg-[#ccff00]/20 text-[#99cc00] rounded-full flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-colors"><Phone size={18} fill="currentColor" /></button>
                  <button className="w-12 h-12 bg-[#ccff00]/20 text-[#99cc00] rounded-full flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-colors"><MessageSquare size={18} fill="currentColor" /></button>
                  <button className="w-12 h-12 bg-[#ccff00]/20 text-[#99cc00] rounded-full flex items-center justify-center hover:bg-[#ccff00] hover:text-black transition-colors"><Mail size={18} fill="currentColor" /></button>
                </div>

                <div className="relative pt-12 px-12 pb-8 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <img 
                      src={selectedUser.user?.avatar || `https://ui-avatars.com/api/?name=${selectedUser.user?.name}&background=111111&color=ffffff`} 
                      alt={selectedUser.user?.name} 
                      className="w-24 h-24 rounded-[32px] object-cover border-4 border-white shadow-lg"
                    />
                    <div>
                      <h2 className="text-4xl font-extrabold tracking-tight mb-2">{selectedUser.user?.name}</h2>
                      <div className="flex items-center gap-4 text-gray-400 font-medium text-sm">
                        <span className="flex items-center gap-1.5"><Briefcase size={16} /> {selectedUser.role}</span>
                        <span className="flex items-center gap-1.5"><Mail size={16} /> {selectedUser.user?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline / Analytics Area */}
                <div className="flex-1 bg-gray-50/50 p-12 overflow-y-auto">
                  <div className="max-w-3xl">
                    <h3 className="text-xl font-bold mb-8">Activity Timeline</h3>
                    
                    {/* Fake timeline mimicking reference */}
                    <div className="relative pl-8 space-y-12 before:absolute before:inset-0 before:ml-[15px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                      
                      {/* Timeline Item 1 */}
                      <div className="relative flex items-start justify-between">
                        <div className="absolute left-[-41px] bg-white w-6 h-6 rounded-full border-4 border-gray-100 shadow-sm z-10 flex items-center justify-center shrink-0"></div>
                        <div className="w-24 shrink-0 text-sm font-bold text-gray-400 pt-1">12 May</div>
                        <div className="flex-1 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm ml-6">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><Briefcase size={14} /></div>
                            <h4 className="font-bold text-gray-900">Project Assignment</h4>
                          </div>
                          <p className="text-gray-500 text-sm ml-11">Assigned to "Frontend Redesign" project by Admin.</p>
                        </div>
                      </div>

                      {/* Timeline Item 2 */}
                      <div className="relative flex items-start justify-between">
                        <div className="absolute left-[-41px] bg-[#ccff00] w-6 h-6 rounded-full border-4 border-white shadow-sm z-10 flex items-center justify-center shrink-0"></div>
                        <div className="w-24 shrink-0 text-sm font-bold text-gray-400 pt-1">15 May</div>
                        <div className="flex-1 bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm ml-6">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center"><MessageSquare size={14} /></div>
                            <h4 className="font-bold text-gray-900">Status Update</h4>
                          </div>
                          
                          <div className="bg-gray-50 rounded-2xl p-4 ml-11">
                            <div className="flex items-center gap-2 mb-2">
                              <img src={selectedUser.user?.avatar} className="w-6 h-6 rounded-full" alt="avatar" />
                              <span className="text-xs font-bold text-gray-700">{selectedUser.user?.name} <span className="text-green-500 font-normal ml-1">● Online</span></span>
                            </div>
                            <div className="bg-black text-white p-4 rounded-xl rounded-tl-none text-sm leading-relaxed mb-2 inline-block">
                              Great, looking forward to starting on the new navigation component today. I'll need access to the Figma files.
                            </div>
                            <p className="text-xs text-gray-400">9:31 AM</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Management Bar (Bottom) */}
                <div className="p-6 border-t border-gray-100 bg-white flex items-center justify-between">
                  {/* Only show management controls if the current viewer is not looking at themselves */}
                  {selectedUser.userId !== currentUser?.id ? (
                    <div className="flex items-center gap-4">
                      <select 
                        value={selectedUser.role}
                        onChange={(e) => handleRoleChange(selectedUser.id, e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block w-40 p-2.5 font-medium"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="MEMBER">Member</option>
                      </select>
                      <button 
                        onClick={() => handleRemove(selectedUser.id)}
                        className="text-red-500 bg-red-50 hover:bg-red-100 font-bold rounded-xl text-sm px-5 py-2.5"
                      >
                        Remove from workspace
                      </button>
                    </div>
                  ) : (
                     <div className="text-sm font-bold text-gray-400 py-2">This is your profile within the workspace.</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">
                Select a team member to view details
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Invite Modal Overlay */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl relative flex flex-col overflow-hidden">
            <div className="px-8 py-8 border-b border-gray-50 flex flex-col items-center justify-center relative">
              <button onClick={() => setIsInviteOpen(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-[#ccff00]/20 rounded-full flex items-center justify-center mb-4 text-[#99cc00]">
                <UserPlus size={32} />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center">Invite Colleague</h2>
              <p className="text-sm text-gray-500 text-center mt-1">Send an email invitation to join this workspace.</p>
            </div>
            
            <form onSubmit={handleInvite} className="p-8 flex flex-col gap-6">
              {inviteError && (
                <div className="bg-red-50 text-red-700 p-3 rounded-xl text-sm flex items-start gap-2 border border-red-100">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" /> <p>{inviteError}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Email Address</label>
                <input type="email" autoFocus required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-black focus:bg-white transition-colors"
                  placeholder="name@company.com" />
              </div>
              
              <div>
                <label className="text-sm font-bold text-gray-700 mb-2 block">Assign Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:border-black cursor-pointer">
                  <option value="MEMBER">Member — Can edit tasks</option>
                  <option value="MANAGER">Manager — Can manage projects</option>
                  <option value="ADMIN">Admin — Full workspace control</option>
                </select>
              </div>
              
              <button type="submit" disabled={inviteLoading || !inviteEmail}
                className="w-full bg-[#ccff00] text-black font-extrabold py-4 rounded-2xl hover:bg-[#b3e600] disabled:opacity-50 transition-colors mt-2 text-base">
                {inviteLoading ? 'Sending Invitation...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}
