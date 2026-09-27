import express from 'express';
import {requireAuth} from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validation.middleware';
import { registerController, loginController, logoutController, getProfileController, updateProfileController, sendVerificationController, verifyEmailController, forgotPasswordController, resetPasswordController } from '../controllers/auth.controller';

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

// ==========================================
// 6. SEND VERIFICATION EMAIL ROUTE (PROTECTED)
// ==========================================
// WHAT: The endpoint to request a verification email.
// HOW: The user must be logged in (Bouncer). We generate a token and "send" the email.
// WHY POST: Sending an email is a state-changing action (generates a new token in the DB).
router.post('/send-verification', requireAuth, sendVerificationController);

// ==========================================
// 7. VERIFY EMAIL ROUTE (PUBLIC)
// ==========================================
// WHAT: The endpoint the user hits when they click the verification link in their email.
// HOW: The raw token comes in the URL query string: /verify-email?token=abc123
// WHY GET: The user is simply clicking a link in their email — that's always a GET request!
// WHY NO BOUNCER: The user might not be logged in when they click the email link!
router.get('/verify-email', verifyEmailController);

// ==========================================
// 8. FORGOT PASSWORD ROUTE (PUBLIC)
// ==========================================
// WHAT: The endpoint to request a password reset email.
// WHY PUBLIC: The user is NOT logged in (they forgot their password!).
// WHY POST: It triggers an action (generates a reset token and "sends" an email).
router.post('/forgot-password', forgotPasswordController);

// ==========================================
// 9. RESET PASSWORD ROUTE (PUBLIC)
// ==========================================
// WHAT: The endpoint to set a new password using the reset token.
// WHY PUBLIC: The user is NOT logged in — they're resetting via the email link.
// WHY POST: It changes the user's password (state-changing action).
router.post('/reset-password', resetPasswordController);

export default router;
