import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createProjectController, getProjectsController, updateProjectController, addProjectMemberController, deleteProjectController } from '../controllers/project.controller';

const router = express.Router({ mergeParams: true });

// POST /api/v1/workspaces/:id/projects — Create a project (Owner/Admin only)
router.post('/', requireAuth, validateBody(['name']), createProjectController);

// GET /api/v1/workspaces/:id/projects — List all projects in a workspace
router.get('/', requireAuth, getProjectsController);

// PATCH /api/v1/workspaces/:id/projects/:projectId — Update/Archive a project (Owner/Admin only)
router.patch('/:projectId', requireAuth, updateProjectController);

// POST /api/v1/workspaces/:id/projects/:projectId/members — Add a member to a project (Owner/Admin only)
router.post('/:projectId/members', requireAuth, validateBody(['userId']), addProjectMemberController);

// DELETE /api/v1/workspaces/:id/projects/:projectId — Delete a project (Owner/Admin only)
router.delete('/:projectId', requireAuth, deleteProjectController);

export default router; 

