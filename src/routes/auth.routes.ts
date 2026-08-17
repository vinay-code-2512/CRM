// Import the Express framework
import express from 'express';

import { validateBody } from '../middleware/validation.middleware';

// Import the Controller (Manager) that will handle registration requests
import { registerController , loginController, logoutController} from '../controllers/auth.controller';

// Create a new Router instance (a mini-app just for Auth routes)
const router = express.Router();

// Define the POST route for user registration
// When a POST request hits '/register', Express will automatically execute registerController(req, res, next)
router.post('/register', validateBody(['name', 'email', 'password']), registerController);

// Define the POST route for user login
// The client only needs to provide 'email' and 'password' to log in
router.post('/login', validateBody(['email', 'password']), loginController);// Export the router so the main Express app can use it
  
// ==========================================
// 3. LOGOUT ROUTE
// ==========================================
// WHAT: The endpoint the frontend will hit to logout.
// HOW: It accepts POST requests at /api/v1/auth/logout.
// WHY: We use POST instead of GET because logout is a "state-changing" action (even though it's stateless on our end, standard REST principles say actions should be POST).
// PURPOSE: Immediately hands the request over to the logoutController.
router.post('/logout', logoutController);

export default router;
