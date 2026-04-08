const express = require('express');
const cors = require('cors');
const { getBoardData, updateTaskColumn } = require('./db');
const authRoutes = require('./routes/auth');
const workspaceRoutes = require('./routes/workspaces');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Main Board & API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);

// Get all columns and tasks (Legacy DB endpoint available temporarily backwards compatible if needed)
app.get('/api/board', async (req, res) => {
  try {
    const data = await getBoardData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching board data:', error);
    res.status(500).json({ error: 'Failed to fetch board data' });
  }
});

// Update task column position
app.put('/api/tasks/:id/move', async (req, res) => {
  const { id } = req.params;
  const { colId } = req.body;

  if (!colId) {
    return res.status(400).json({ error: 'colId is required' });
  }

  try {
    const changes = await updateTaskColumn(id, colId);
    if (changes === 0) {
       return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ success: true, message: 'Task updated successfully' });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.listen(port, () => {
  console.log(`Kanban API listening at http://localhost:${port}`);
});
