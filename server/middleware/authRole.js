const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function checkRole(allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      // Depending on the route, we need to know the workspaceId to check the role.
      // Easiest is to pass workspaceId in body or params, or if there's a projectId, find the workspaceId
      let workspaceId = req.body.workspaceId || req.params.workspaceId || req.query.workspaceId;

      if (!workspaceId) {
        // If it's a project route, it might have projectId instead
        const projectId = req.params.projectId || req.body.projectId;
        if (projectId) {
          const project = await prisma.project.findUnique({ where: { id: projectId } });
          if (project) workspaceId = project.workspaceId;
        }
      }

      if (!workspaceId) {
        return res.status(400).json({ error: 'Workspace ID is required for role validation' });
      }

      const member = await prisma.workspaceMember.findUnique({
        where: { userId_workspaceId: { userId, workspaceId } }
      });

      if (!member || !allowedRoles.includes(member.role)) {
        return res.status(403).json({ error: 'Access denied: insufficient permissions' });
      }

      req.userRole = member.role;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Role validation failed' });
    }
  };
}

module.exports = { checkRole };
