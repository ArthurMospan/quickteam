import { create } from 'zustand';

export const useBoardStore = create((set, get) => ({
  columns: [],
  tasks: {},
  members: [],
  loading: true,
  searchQuery: '',
  filterProject: '',
  filterPriority: '',
  availableProjects: [],

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterProject: (projectId) => set({ filterProject: projectId }),
  setFilterPriority: (priority) => set({ filterPriority: priority }),

  fetchBoard: async (projectId, token) => {
    set({ loading: true });
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/board`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch board');
      const data = await res.json();
      set({ columns: data.columns, tasks: data.tasks, members: data.members || [], loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  fetchGlobalBoard: async (token) => {
    set({ loading: true });
    try {
      const res = await fetch('http://localhost:3000/api/workspaces/global-board', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch global board');
      const data = await res.json();
      set({ 
        columns: data.columns, 
        tasks: data.tasks, 
        availableProjects: data.projects || [],
        loading: false 
      });
    } catch (err) {
      console.error(err);
      set({ loading: false });
    }
  },

  updateTask: (taskId, updates) => set(state => ({
    tasks: {
      ...state.tasks,
      [taskId]: {
        ...state.tasks[taskId],
        ...updates
      }
    }
  })),
  
  moveTask: async (taskId, colId, token) => {
    const previousTasks = { ...get().tasks };
    
    set((state) => ({
      tasks: {
        ...state.tasks,
        [taskId]: {
          ...state.tasks[taskId],
          colId
        }
      }
    }));

    try {
      const res = await fetch(`http://localhost:3000/api/tasks/${taskId}/move`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ colId })
      });
      if (!res.ok) throw new Error('Move failed on backend');
    } catch (err) {
      set({ tasks: previousTasks });
      console.error('Failed to update task column on server:', err);
    }
  },

  createTask: async (taskData, token) => {
    try {
      const res = await fetch('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(taskData)
      });
      if (!res.ok) throw new Error('Failed to create task');
      const newTask = await res.json();
      
      set(state => ({
        tasks: {
          ...state.tasks,
          [newTask.id]: newTask
        }
      }));
      return true;
    } catch (err) {
      console.error('Failed to create task', err);
      return false;
    }
  },

  createColumn: async (projectId, title, token) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed');
      const col = await res.json();
      set(state => ({ columns: [...state.columns, col] }));
    } catch (err) { console.error(err); }
  },

  renameColumn: async (projectId, colId, title, token) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/columns/${colId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title })
      });
      if (!res.ok) throw new Error('Failed');
      const col = await res.json();
      set(state => ({
        columns: state.columns.map(c => c.id === colId ? col : c)
      }));
    } catch (err) { console.error(err); }
  },

  deleteColumn: async (projectId, colId, token) => {
    try {
      const res = await fetch(`http://localhost:3000/api/projects/${projectId}/columns/${colId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      set(state => ({
        columns: state.columns.filter(c => c.id !== colId)
      }));
    } catch (err) { console.error(err); }
  }
}));
