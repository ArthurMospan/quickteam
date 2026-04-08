const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/authRole');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Get full board for a project
router.get('/:projectId/board', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Check access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: { members: { include: { user: true } } }
        }
      }
    });

    if (!project || !project.workspace.members.some(m => m.userId === req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const columns = await prisma.column.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    });

    // Auto-create default columns tracking the legacy DB structure if none exist
    if (columns.length === 0) {
      const defaultCols = ["Backlog", "To Do", "In Progress", "Review", "Done"];
      for (let i = 0; i < defaultCols.length; i++) {
        const col = await prisma.column.create({
          data: { title: defaultCols[i], order: i, projectId }
        });
        columns.push(col);
      }
    }

    const tasks = await prisma.task.findMany({
      where: { column: { projectId } },
      include: { 
        assignees: { include: { user: true } },
        tags: { include: { tag: true } },
        attachments: true
      }
    });

    const taskObj = {};
    tasks.forEach(t => {
      const firstAssignee = t.assignees?.[0]?.user;
      taskObj[t.id] = {
        id: t.id,
        title: t.title,
        description: t.description,
        user: firstAssignee ? firstAssignee.name : 'Unassigned',
        avatar: firstAssignee ? firstAssignee.avatar : 'https://i.pravatar.cc/150?u=unassigned',
        date: new Date(t.createdAt).toLocaleDateString('uk-UA'),
        color: t.color,
        hasBookmark: t.hasBookmark,
        colId: t.columnId,
        priority: t.priority,
        deadline: t.deadline,
        assignees: t.assignees.map(a => a.user),
        tags: t.tags.map(tagRel => tagRel.tag),
        attachments: t.attachments
      };
    });

    res.json({ 
      columns, 
      tasks: taskObj, 
      members: project.workspace.members.map(m =>({
        id: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar || `https://ui-avatars.com/api/?name=${m.user.name}`,
        email: m.user.email,
        role: m.role
      })) 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch board' });
  }
});

// Create Column manually
router.post('/:projectId/columns', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title } = req.body;
    
    const count = await prisma.column.count({ where: { projectId } });
    const column = await prisma.column.create({
      data: { title, order: count, projectId }
    });
    
    res.json(column);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create column' });
  }
});

// Rename Column
router.put('/:projectId/columns/:colId', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { title } = req.body;
    const { colId } = req.params;
    const col = await prisma.column.update({
      where: { id: colId },
      data: { title }
    });
    res.json(col);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rename col' });
  }
});

// Delete Column
router.delete('/:projectId/columns/:colId', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { colId } = req.params;
    await prisma.column.delete({ where: { id: colId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete col' });
  }
});

// Get project analytics
router.get('/:projectId/analytics', async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: { include: { members: true } } }
    });

    if (!project || !project.workspace.members.some(m => m.userId === req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const columns = await prisma.column.findMany({
      where: { projectId },
      orderBy: { order: 'asc' }
    });
    
    if (columns.length === 0) return res.json({ total: 0, completed: 0, completionRate: 0, burnDown: [], distribution: [] });
    
    const tasks = await prisma.task.findMany({
      where: { column: { projectId } }
    });

    const doneColId = columns[columns.length - 1].id;
    const completedTasks = tasks.filter(t => t.columnId === doneColId);

    const dateMap = {};
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toLocaleDateString('uk-UA');
      dateMap[str] = { date: str, total: 0, completed: 0 };
    }

    tasks.forEach(t => {
      const dStr = new Date(t.createdAt).toLocaleDateString('uk-UA');
      if (dateMap[dStr]) {
        dateMap[dStr].total += 1;
        if (t.columnId === doneColId) {
          dateMap[dStr].completed += 1;
        }
      }
    });

    const chartData = Object.values(dateMap);

    const colDistribution = columns.map(col => ({
      name: col.title,
      count: tasks.filter(t => t.columnId === col.id).length
    }));

    res.json({
      total: tasks.length,
      completed: completedTasks.length,
      completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      burnDown: chartData,
      distribution: colDistribution
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
