// Import the Express framework
import express from 'express';
import {requireAuth} from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validation.middleware';

// Import the Controller (Manager) that will handle registration requests
import { registerController, loginController, logoutController, getProfileController, updateProfileController } from '../controllers/auth.controller';
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

// ==========================================
// 4. GET PROFILE ROUTE (PROTECTED)
// ==========================================
// WHAT: The endpoint to get the currently logged-in user's profile.
// HOW: The request MUST pass through the Bouncer (requireAuth) before reaching the Manager!
router.get('/me', requireAuth, getProfileController);


// ==========================================
// 5. UPDATE PROFILE ROUTE (PROTECTED)
// ==========================================
// WHAT: The endpoint to update the user's profile (name only).
// HOW: We use the Bouncer (requireAuth) AND the Receptionist (validateBody) 
// to ensure they are logged in AND they sent a valid 'name' field.
router.put('/me', requireAuth, validateBody(['name']), updateProfileController);

export default router;
