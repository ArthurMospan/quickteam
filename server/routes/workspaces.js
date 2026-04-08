const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/authRole');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticateToken);

// Get all projects for the current user (flat, no workspace wrapping)
router.get('/my-projects', async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: { 
            projects: true,
            members: { include: { user: true } }
          }
        }
      }
    });
    
    const projects = [];
    const members = [];
    let defaultWorkspaceId = null;
    
    memberships.forEach(m => {
      if (!defaultWorkspaceId) defaultWorkspaceId = m.workspace.id;
      m.workspace.projects.forEach(p => {
        projects.push({ ...p, workspaceId: m.workspace.id, workspaceName: m.workspace.name });
      });
      m.workspace.members.forEach(mem => {
        if (!members.find(x => x.id === mem.id)) {
          members.push(mem);
        }
      });
    });
    
    res.json({ projects, members, defaultWorkspaceId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Create project in user's default workspace
router.post('/my-projects', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    // Find the user's first workspace (default)
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId: req.user.id, role: 'ADMIN' },
      include: { workspace: true }
    });

    if (!membership) {
      return res.status(400).json({ error: 'No workspace found. Please contact support.' });
    }

    const pKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) || 'QT';

    const newProject = await prisma.project.create({
      data: { name, key: pKey, workspaceId: membership.workspaceId }
    });

    // Initialize standard Kanban columns
    const kanbanCols = ["Backlog", "To Do", "In Progress", "Review", "Done"];
    for (let i = 0; i < kanbanCols.length; i++) {
      await prisma.column.create({
        data: { title: kanbanCols[i], order: i, projectId: newProject.id }
      });
    }

    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Global board — all tasks from all user's projects
router.get('/global-board', async (req, res) => {
  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      select: { workspaceId: true }
    });
    const wsIds = memberships.map(m => m.workspaceId);

    const projects = await prisma.project.findMany({
      where: { workspaceId: { in: wsIds } },
      include: {
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              include: {
                assignees: { include: { user: true } },
                tags: { include: { tag: true } },
                column: { include: { project: true } }
              }
            }
          }
        }
      }
    });

    // Build unified column list (merge by title across projects)
    const columnMap = new Map();
    const allTasks = {};

    projects.forEach(project => {
      project.columns.forEach(col => {
        if (!columnMap.has(col.title)) {
          columnMap.set(col.title, { id: col.title, title: col.title, order: col.order, columnIds: [] });
        }
        columnMap.get(col.title).columnIds.push(col.id);
        
        col.tasks.forEach(t => {
          allTasks[t.id] = {
            id: t.id,
            title: t.title,
            description: t.description,
            color: t.color,
            hasBookmark: t.hasBookmark,
            colId: col.title, // Use unified column title
            realColId: t.columnId,
            priority: t.priority,
            deadline: t.deadline,
            createdAt: t.createdAt,
            projectName: project.name,
            projectId: project.id,
            assignees: t.assignees.map(a => a.user),
            tags: t.tags.map(tr => tr.tag),
            date: new Date(t.createdAt).toLocaleDateString('uk-UA')
          };
        });
      });
    });

    const columns = Array.from(columnMap.values()).sort((a, b) => a.order - b.order);

    res.json({ columns, tasks: allTasks, projects: projects.map(p => ({ id: p.id, name: p.name })) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch global board' });
  }
});

// Get all workspaces for the current user (legacy)
router.get('/', async (req, res) => {
  try {
    const userWorkspaces = await prisma.workspaceMember.findMany({
      where: { userId: req.user.id },
      include: {
        workspace: {
          include: { 
            projects: true,
            members: { include: { user: true } } 
          }
        }
      }
    });
    
    // Flatten result and attach the workspace owner's details to each project
    const workspaces = userWorkspaces.map(wm => {
      const ws = wm.workspace;
      const owner = ws.members.find(m => m.role === 'ADMIN');
      ws.projects = ws.projects.map(p => ({
        ...p,
        creator: owner ? { name: owner.user.name, avatar: owner.user.avatar } : null
      }));
      return ws;
    });

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workspaces' });
  }
});

// Create a new workspace
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) return res.status(400).json({ error: 'Workspace name is required' });

    const newWorkspace = await prisma.workspace.create({
      data: {
        name,
        description,
        members: {
          create: {
            userId: req.user.id,
            role: 'ADMIN'
          }
        }
      },
      include: { projects: true }
    });

    res.json(newWorkspace);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// Create a project in a workspace
router.post('/:workspaceId/projects', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).json({ error: 'Project name is required' });

    // Verify user is member of workspace
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: { userId: req.user.id, workspaceId }
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const pKey = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 3) || 'QT';

    const newProject = await prisma.project.create({
      data: {
        name,
        key: pKey,
        workspaceId
      }
    });

    // Fetch workspace default columns if they exist
    const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { defaultColumns: true } });
    const kanbanCols = ["Backlog", "To Do", "In Progress", "Review", "Done"];
    const defaultCols = workspace?.defaultColumns ? JSON.parse(workspace.defaultColumns) : kanbanCols;

    for (let i = 0; i < defaultCols.length; i++) {
      await prisma.column.create({
        data: { title: defaultCols[i], order: i, projectId: newProject.id }
      });
    }

    res.json(newProject);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all members of a workspace
router.get('/:workspaceId/members', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: req.user.id, workspaceId } }
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: true }
    });
    
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// Update workspace default columns
router.put('/:workspaceId/columns', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { defaultColumns } = req.body; // Array of strings e.g. ["To Do", "In Progress", "Done"]

    if (!Array.isArray(defaultColumns)) {
      return res.status(400).json({ error: 'defaultColumns must be an array of strings' });
    }

    const updatedWorkspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data: { defaultColumns: JSON.stringify(defaultColumns) }
    });

    res.json(updatedWorkspace);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update columns' });
  }
});

// Invite a user to workspace by email
router.post('/:workspaceId/members', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email, role } = req.body; 
    
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userToInvite = await prisma.user.findUnique({ where: { email } });
    if (!userToInvite) {
      return res.status(404).json({ error: 'User not found in system' });
    }

    const existingMember = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: userToInvite.id, workspaceId } }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this workspace' });
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        userId: userToInvite.id,
        workspaceId,
        role: role || 'MEMBER'
      },
      include: { user: true }
    });

    res.json(newMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

// Update member role
router.put('/:workspaceId/members/:memberId', checkRole(['ADMIN']), async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    const { role } = req.body;
    
    if (!['ADMIN', 'MANAGER', 'MEMBER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updatedMember = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
      include: { user: true }
    });

    res.json(updatedMember);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Remove member from workspace
router.delete('/:workspaceId/members/:memberId', checkRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { workspaceId, memberId } = req.params;
    
    const memberToRemove = await prisma.workspaceMember.findUnique({ where: { id: memberId } });
    if (!memberToRemove) return res.status(404).json({ error: 'Member not found' });
    
    if (memberToRemove.role === 'ADMIN') {
      const adminCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: 'ADMIN' }
      });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot remove the last admin of the workspace' });
      }
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

module.exports = router;
