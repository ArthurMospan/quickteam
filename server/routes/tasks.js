const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Get My Tasks
router.get('/me', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        column: { include: { project: true } },
        assignee: true,
        tags: { include: { tag: true } }
      },
      orderBy: { deadline: 'asc' }
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch my tasks' });
  }
});

// Create Task
router.post('/', async (req, res) => {
  try {
    const { title, color, columnId, priority, deadline, assigneeId, type, storyPoints } = req.body;
    
    const count = await prisma.task.count({ where: { columnId } });

    // Generate Task ID (Key)
    const column = await prisma.column.findUnique({ where: { id: columnId }, include: { project: true } });
    const project = column ? column.project : null;
    let taskKey = "QT-1";
    if (project) {
        const newTaskCount = project.taskCount + 1;
        await prisma.project.update({ where: { id: project.id }, data: { taskCount: newTaskCount } });
        taskKey = `${project.key || 'QT'}-${newTaskCount}`;
    }

    const taskData = {
      taskKey,
      title,
      type: type || 'Task',
      storyPoints: storyPoints || null,
      color: color || 'white',
      columnId,
      order: count,
      priority: priority || 'Medium',
      deadline: deadline ? new Date(deadline) : null,
      assigneeId: assigneeId || req.user.id,
      reporterId: req.user.id
    };

    const task = await prisma.task.create({
      data: taskData,
      include: { 
        assignee: true,
        assignees: { include: { user: true } },
        tags: { include: { tag: true } },
        attachments: true
      }
    });

    await prisma.activity.create({
      data: {
        action: 'created',
        details: 'Task was created',
        taskId: task.id,
        userId: req.user.id
      }
    });

    const firstAssignee = task.assignee || task.assignees?.[0]?.user;
    const formattedTask = {
      taskKey: task.taskKey,
      type: task.type,
      storyPoints: task.storyPoints,
      reporterId: task.reporterId,
      id: task.id,
      title: task.title,
      description: task.description,
      user: firstAssignee ? firstAssignee.name : 'Unassigned',
      avatar: firstAssignee ? firstAssignee.avatar : 'https://i.pravatar.cc/150?u=unassigned',
      date: new Date(task.createdAt).toLocaleDateString('uk-UA'),
      color: task.color,
      hasBookmark: task.hasBookmark,
      colId: task.columnId,
      priority: task.priority,
      deadline: task.deadline,
      assigneeId: task.assigneeId,
      assignees: task.assignees ? task.assignees.map(a => a.user) : (firstAssignee ? [firstAssignee] : []),
      tags: task.tags.map(tt => tt.tag),
      attachments: task.attachments
    };

    res.json(formattedTask);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update Task Details (E.g., Description, Priority, Deadline, Assignee)
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, priority, deadline, assigneeId, type, storyPoints } = req.body;

    const updateData = {};
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (deadline === null) updateData.deadline = null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
    if (type !== undefined) updateData.type = type;
    if (storyPoints !== undefined) updateData.storyPoints = storyPoints;

    const existingTask = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (assigneeId !== undefined && assigneeId !== null && assigneeId !== req.user.id) {
       await prisma.notification.create({
         data: {
           userId: assigneeId,
           message: `Ви були призначені на задачу "${existingTask?.title || 'Unknown'}"`,
           type: 'assignment',
           taskId: taskId
         }
       });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignee: true, assignees: { include: { user: true } }, tags: { include: { tag: true } } }
    });

    await prisma.activity.create({
      data: {
        action: 'updated',
        details: 'Updated task details',
        taskId: task.id,
        userId: req.user.id
      }
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update task detail' });
  }
});

// Move Task
router.put('/:taskId/move', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { colId } = req.body;

    const task = await prisma.task.update({
      where: { id: taskId },
      data: { columnId: colId }
    });

    await prisma.activity.create({
      data: {
        action: 'moved',
        details: `Moved task across board`,
        taskId: task.id,
        userId: req.user.id
      }
    });

    res.json({ success: true, task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to move task' });
  }
});

// Get Detailed Task View (Comments & Activities)
router.get('/:taskId/details', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        assignees: { include: { user: true } },
        tags: { include: { tag: true } },
        attachments: true,
        comments: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        },
        activities: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});

// Post a new comment
router.post('/:taskId/comments', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        userId: req.user.id
      },
      include: { user: true }
    });

    await prisma.activity.create({
      data: {
        action: 'commented',
        details: 'Left a comment',
        taskId,
        userId: req.user.id
      }
    });

    const taskData = await prisma.task.findUnique({
      where: { id: taskId }, include: { assignee: true, assignees: true }
    });

    if (taskData) {
      // Notify the assignee if it's not the comment author
      if (taskData.assigneeId && taskData.assigneeId !== req.user.id) {
        await prisma.notification.create({
          data: {
            userId: taskData.assigneeId,
            message: `Новий коментар у задачі "${taskData.title}"`,
            type: 'comment',
            taskId: taskId
          }
        });
      }
    }

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

module.exports = router;
