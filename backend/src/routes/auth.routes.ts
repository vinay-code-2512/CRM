import express from 'express';
import {requireAuth} from '../middleware/auth.middleware'
import { validateBody } from '../middleware/validation.middleware';
import { authLimiter } from '../middleware/security.middleware';
import { registerController, loginController, logoutController, getProfileController, updateProfileController, sendVerificationController, verifyEmailController, forgotPasswordController, resetPasswordController } from '../controllers/auth.controller';

// Create a new Router instance (a mini-app just for Auth routes)
const router = express.Router();

// Define the POST route for user registration
// When a POST request hits '/register', Express will automatically execute registerController(req, res, next)
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/register', authLimiter, validateBody(['name', 'email', 'password']), registerController);

// Define the POST route for user login
// The client only needs to provide 'email' and 'password' to log in
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: SecurePassword123
 *     responses:
 *       200:
 *         description: Login successful. Returns JWT token and user object.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: jwt.token.string
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', authLimiter, validateBody(['email', 'password']), loginController);

// ==========================================
// 3. LOGOUT ROUTE
// ==========================================
// WHAT: The endpoint the frontend will hit to logout.
// HOW: It accepts POST requests at /api/v1/auth/logout.
// WHY: We use POST instead of GET because logout is a "state-changing" action (even though it's stateless on our end, standard REST principles say actions should be POST).
// PURPOSE: Immediately hands the request over to the logoutController.
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
router.post('/logout', logoutController);

// ==========================================
// 4. GET PROFILE ROUTE (PROTECTED)
// ==========================================
// WHAT: The endpoint to get the currently logged-in user's profile.
// HOW: The request MUST pass through the Bouncer (requireAuth) before reaching the Manager!
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the current user's profile
 *     tags: [User Profile]
 *     responses:
 *       200:
 *         description: User profile object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', requireAuth, getProfileController);


// ==========================================
// 5. UPDATE PROFILE ROUTE (PROTECTED)
// ==========================================
// WHAT: The endpoint to update the user's profile (name only).
// HOW: We use the Bouncer (requireAuth) AND the Receptionist (validateBody) 
// to ensure they are logged in AND they sent a valid 'name' field.
/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Update the current user's profile
 *     tags: [User Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *     responses:
 *       200:
 *         description: Updated user object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.put('/me', requireAuth, validateBody(['name']), updateProfileController);

// ==========================================
// 6. SEND VERIFICATION EMAIL ROUTE (PROTECTED)
// ==========================================
// WHAT: The endpoint to request a verification email.
// HOW: The user must be logged in (Bouncer). We generate a token and "send" the email.
// WHY POST: Sending an email is a state-changing action (generates a new token in the DB).
/**
 * @swagger
 * /auth/send-verification:
 *   post:
 *     summary: Send a verification email to the current user
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Verification email sent
 *       401:
 *         description: Unauthorized
 */
router.post('/send-verification', requireAuth, sendVerificationController);

// ==========================================
// 7. VERIFY EMAIL ROUTE (PUBLIC)
// ==========================================
// WHAT: The endpoint the user hits when they click the verification link in their email.
// HOW: The raw token comes in the URL query string: /verify-email?token=abc123
// WHY GET: The user is simply clicking a link in their email — that's always a GET request!
// WHY NO BOUNCER: The user might not be logged in when they click the email link!
/**
 * @swagger
 * /auth/verify-email:
 *   get:
 *     summary: Verify the user's email address using a token
 *     tags: [Authentication]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token from the verification link
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get('/verify-email', verifyEmailController);

// ==========================================
// 8. FORGOT PASSWORD ROUTE (PUBLIC)
// ==========================================
// WHAT: The endpoint to request a password reset email.
// WHY PUBLIC: The user is NOT logged in (they forgot their password!).
// WHY POST: It triggers an action (generates a reset token and "sends" an email).
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', forgotPasswordController);

// ==========================================
// 9. RESET PASSWORD ROUTE (PUBLIC)
// ==========================================
// WHAT: The endpoint to set a new password using the reset token.
// WHY PUBLIC: The user is NOT logged in — they're resetting via the email link.
// WHY POST: It changes the user's password (state-changing action).
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 example: NewSecurePassword456
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPasswordController);

export default router;
