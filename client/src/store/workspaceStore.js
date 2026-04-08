import { create } from 'zustand';

export const useWorkspaceStore = create((set, get) => ({
  projects: [],
  members: [],
  defaultWorkspaceId: null,
  loading: false,

  fetchProjects: async (token) => {
    set({ loading: true });
    try {
      const res = await fetch('http://localhost:3000/api/workspaces/my-projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      
      set({ 
        projects: data.projects, 
        members: data.members,
        defaultWorkspaceId: data.defaultWorkspaceId,
        loading: false 
      });
    } catch (error) {
      console.error(error);
      set({ loading: false });
    }
  },

  createProject: async (token, name) => {
    const res = await fetch('http://localhost:3000/api/workspaces/my-projects', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to create project');
    const newProject = await res.json();
    set(state => ({ 
      projects: [...state.projects, newProject]
    }));
    return newProject;
  },

  inviteMember: async (token, email, role) => {
    const wsId = get().defaultWorkspaceId;
    if (!wsId) return { success: false, error: 'No workspace' };
    try {
      const res = await fetch(`http://localhost:3000/api/workspaces/${wsId}/members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ email, role })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to invite');
      }
      const newMember = await res.json();
      set(state => ({ members: [...state.members, newMember] }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  updateMemberRole: async (token, memberId, role) => {
    const wsId = get().defaultWorkspaceId;
    if (!wsId) return { success: false };
    try {
      const res = await fetch(`http://localhost:3000/api/workspaces/${wsId}/members/${memberId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error('Failed to update role');
      const updatedMember = await res.json();
      set(state => ({
        members: state.members.map(m => m.id === memberId ? updatedMember : m)
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  removeMember: async (token, memberId) => {
    const wsId = get().defaultWorkspaceId;
    if (!wsId) return { success: false };
    try {
      const res = await fetch(`http://localhost:3000/api/workspaces/${wsId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove member');
      }
      set(state => ({
        members: state.members.filter(m => m.id !== memberId)
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}));
