import express from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { createWorkspaceController, getWorkspacesController, getWorkspaceByIdController } from '../controllers/workspace.controller';

const router = express.Router();

// POST /api/v1/workspaces — Create a new workspace (Protected) 
router.post('/', requireAuth, validateBody(['name']), createWorkspaceController);

// GET /api/v1/workspaces — Get all workspaces for the user (Protected)
router.get('/', requireAuth, getWorkspacesController);

// GET /api/v1/workspaces/:id — Get a specific workspace by ID (Protected)
router.get('/:id', requireAuth, getWorkspaceByIdController);

export default router;
