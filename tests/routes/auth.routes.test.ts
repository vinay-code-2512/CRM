import request from 'supertest';
import bcrypt from 'bcryptjs'
import db from '../../src/lib/prisma';
import { UserModel as User } from '../../src/models/UserPrisma';

// We import our main app! Supertest needs this to send HTTP requests to it.
import app from '../../src/app';

describe('Auth API Routes', () => {
    beforeAll(async () => {
        await db.connect();
    });

    // Standard database setup (Start the server) 
    // Standard database cleanup (Stop the server)
    // Wipe users before every test

    afterEach(async () => {
        await (db.orm as any).public.User.deleteAll();
    });

    // API Tests will go here...
    // TEST 1: The Happy Path
    it('should register a user successfully and return 201', async () => {

        // 1. We use Supertest to send a real HTTP request to our Express app
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'API Test User',
                email: 'api@example.com',
                password: 'password123'
            });

        // 2. Check the HTTP status code from the Controller
        expect(response.status).toBe(201);

        // 3. Check the JSON data returned by the Controller
        expect(response.body.name).toBe('API Test User');
        expect(response.body.email).toBe('api@example.com');

        // 4. SECURITY CHECK: Ensure passwordHash is NOT sent to the client!
        expect(response.body).not.toHaveProperty('passwordHash');

        // 5. DATABASE CHECK: Let's manually look in MongoDB to ensure the user is actually there!
        const userInDb = await User.findByEmail('api@example.com' );
        expect(userInDb).not.toBeNull();
        expect(userInDb!.name).toBe('API Test User');
    });

    // TEST 2: The Duplicate Email Error
    it('should return 400 if the email is already registered', async () => {

        // 1. Manually put a user in the database FIRST
        await User.create({
            name: 'Existing User',
            email: 'duplicate@example.com',
            passwordHash: 'hashedpassword'
        });

        // 2. Try to register a NEW user with the EXACT SAME EMAIL via the API
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'New User',
                email: 'duplicate@example.com', // This should trigger the error!
                password: 'password123'
            });

        // 3. We expect the server to reject the request and return status 400 (Bad Request)
        expect(response.status).toBe(400);

        // 4. We expect our Global Error Handler to send back an error message
        expect(response.body).toHaveProperty('error');
        expect(response.body.message).toBe('User already exists with this email');
    });

    // TEST 3: Validation Error (Missing password)
    it('should return 400 if required data is missing', async () => {

        // 1. Send an HTTP request but purposely "forget" the password field
        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Missing Password User',
                email: 'missing@example.com'
                // password is intentionally missing!
            });

        // 2. We expect the validation middleware to block it and return 400 (Bad Request)
        expect(response.status).toBe(400);

        // 3. We expect an error response
        expect(response.body).toHaveProperty('error');

        // Note: The exact error message depends on how Mongoose or your validation middleware formats it.
        // Usually, it will mention that "password" is required.
        // We will just verify it contains the word "password" (case-insensitive) somewhere in the message!
        expect(response.body.message.toLowerCase()).toContain('password');
    });


    describe('POST /api/v1/auth/login', () => {
        // WHAT: Setup - Insert a fake user into the database
        // WHY: We are testing the FULL pipe (Route -> Controller -> Service -> Database). 
        // A user MUST exist in the DB for the Service to find them!
        beforeEach(async () => {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            await User.create({
                name: 'Route Login User',
                email: 'routelogin@example.com',
                passwordHash: hashedPassword
            });
        });

        // WHAT: Test 1 - The Happy Path
        // WHY: Prove that if the Receptionist, Manager, and Worker all succeed, we get our JWT.
        it('should login successfully with correct credentials', async () => {
            // HOW: Use Supertest to fire a real HTTP POST request at our app!
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'routelogin@example.com',
                    password: 'password123'
                });

            // SECURITY CHECK: The final output must be 200 OK
            expect(response.status).toBe(200);

            // SECURITY CHECK: The final output must contain the JWT
            expect(response.body).toHaveProperty('token');

            // SECURITY CHECK: The final output must hide the password hash!
            expect(response.body.user.email).toBe('routelogin@example.com');
            expect(response.body.user).not.toHaveProperty('passwordHash');
        });

        // WHAT: Test 2 - The Validation Middleware Check (The Receptionist)
        // WHY: Prove that the 'validateBody' middleware kicks the user out if they forget the password
        it('should return 400 Bad Request if password is missing', async () => {
            // HOW: Send a request but maliciously omit the password field
            const response = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'routelogin@example.com'
                });

            // SECURITY CHECK: The middleware should block them with a 400 Error BEFORE they reach the Manager!
            expect(response.status).toBe(400);
        });
    });


    // ==========================================
    // 3. LOGOUT ROUTE INTEGRATION TESTS
    // ==========================================
    describe('POST /api/v1/auth/logout', () => {

        // WHAT: Test 1 - The Happy Path
        // WHY: Prove that a user can successfully log out through the full API pipeline.
        it('should return 200 OK and a success message', async () => {

            // HOW: We use Supertest to simulate Postman firing a POST request to the /logout route.
            const response = await request(app)
                .post('/api/v1/auth/logout')
                .send(); // No body required for logout!

            // SECURITY CHECK: Did the entire pipe work without crashing and return 200?
            expect(response.status).toBe(200);

            // SECURITY CHECK: Did we get the exact JSON message we expect?
            expect(response.body).toEqual({
                message: 'Logout Successfully'
            });
        });
    });


    // ==========================================
    // 4. GET PROFILE ROUTE INTEGRATION TESTS
    // ==========================================
    describe('GET /api/v1/auth/me', () => {
        let validToken: string;

        // HOW: Before testing the protected route, we MUST register a user and log them in to get a real token!
        beforeEach(async () => {
            const testEmail = `route${Math.random()}@test.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Route Tester',
                    email: testEmail,
                    password: 'password123'
                });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testEmail,
                    password: 'password123'
                });
            validToken = res.body.token; // Grab the real JWT token!
        });

        it('should return 401 if no token is provided', async () => {
            // HOW: We try to hit the protected route WITHOUT a token
            const response = await request(app).get('/api/v1/auth/me');

            // SECURITY CHECK: The Bouncer should block us!
            expect(response.status).toBe(401);
        });

        it('should return 200 and profile if valid token is provided', async () => {
            const response = await request(app)
                .get('/api/v1/auth/me')
                .set('Authorization', `Bearer ${validToken}`); // HOW: Attach the token to the header like Postman!

            expect(response.status).toBe(200);
            expect(response.body.user.name).toBe('Route Tester');
        });
    });

    // ==========================================
    // 5. UPDATE PROFILE ROUTE INTEGRATION TESTS
    // ==========================================
    describe('PUT /api/v1/auth/me', () => {
        let validToken: string;

        beforeEach(async () => {
            const testEmail = `update${Math.random()}@test.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Update Tester',
                    email: testEmail,
                    password: 'password123'
                });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testEmail,
                    password: 'password123'
                });
            validToken = res.body.token;
        });

        it('should return 400 if name is missing from body', async () => {
            const response = await request(app)
                .put('/api/v1/auth/me')
                .set('Authorization', `Bearer ${validToken}`)
                .send({}); // Maliciously forgetting to send the 'name'!

            // SECURITY CHECK: The Receptionist (validateBody) should block it with a 400 Error!
            expect(response.status).toBe(400);
        });

        it('should return 200 and updated profile if valid request', async () => {
            const response = await request(app)
                .put('/api/v1/auth/me')
                .set('Authorization', `Bearer ${validToken}`)
                .send({ name: 'Fresh Name' });

            expect(response.status).toBe(200);
            expect(response.body.user.name).toBe('Fresh Name');
        });
    });

    // ==========================================
    // 6. SEND VERIFICATION EMAIL ROUTE INTEGRATION TESTS
    // ==========================================
    describe('POST /api/v1/auth/send-verification', () => {
        let validToken: string;

        // HOW: Register + Login to get a real JWT token
        beforeEach(async () => {
            const testEmail = `verify${Math.random()}@test.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Verify Route Tester',
                    email: testEmail,
                    password: 'password123'
                });

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testEmail,
                    password: 'password123'
                });
            validToken = res.body.token;
        });

        it('should return 401 if no token is provided', async () => {
            const response = await request(app)
                .post('/api/v1/auth/send-verification');

            expect(response.status).toBe(401);
        });

        it('should return 200 and a verification token if logged in', async () => {
            const response = await request(app)
                .post('/api/v1/auth/send-verification')
                .set('Authorization', `Bearer ${validToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Verification email sent successfully');
            expect(response.body.verificationToken).toBeDefined();
        });
    });

    // ==========================================
    // 7. VERIFY EMAIL ROUTE INTEGRATION TESTS
    // ==========================================
    describe('GET /api/v1/auth/verify-email', () => {

        it('should return 400 if no token query param is provided', async () => {
            const response = await request(app)
                .get('/api/v1/auth/verify-email');

            expect(response.status).toBe(400);
        });

        it('should return 400 if token is invalid', async () => {
            const response = await request(app)
                .get('/api/v1/auth/verify-email?token=fake-garbage-token');

            expect(response.status).toBe(400);
        });

        it('should return 200 and verify the email with a valid token', async () => {
            // STEP 1: Register + Login
            const testEmail = `fullverify${Math.random()}@test.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Full Verify Tester',
                    email: testEmail,
                    password: 'password123'
                });

            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: testEmail,
                    password: 'password123'
                });
            const validToken = loginRes.body.token;

            // STEP 2: Request a verification token
            const sendRes = await request(app)
                .post('/api/v1/auth/send-verification')
                .set('Authorization', `Bearer ${validToken}`);

            const verificationToken = sendRes.body.verificationToken;

            // STEP 3: Use the token to verify the email!
            const verifyRes = await request(app)
                .get(`/api/v1/auth/verify-email?token=${verificationToken}`);

            expect(verifyRes.status).toBe(200);
            expect(verifyRes.body.message).toBe('Email verified successfully');
            expect(verifyRes.body.user.isEmailVerified).toBe(true);
        });
    });

    // ==========================================
    // 8. FORGOT PASSWORD ROUTE INTEGRATION TESTS
    // ==========================================
    describe('POST /api/v1/auth/forgot-password', () => {

        it('should return 200 with generic message for existing email', async () => {
            // STEP 1: Register a user first
            const testEmail = `forgot${Math.random()}@test.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Forgot Tester',
                    email: testEmail,
                    password: 'password123'
                });

            // STEP 2: Request password reset
            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ email: testEmail });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('If an account exists for this email, a password reset link has been sent.');
        });

        it('should return 200 with the EXACT SAME message for non-existing email (Zero-Knowledge)', async () => {
            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({ email: 'ghost@nowhere.com' });

            // SECURITY CHECK: Must NOT leak "User not found"
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('If an account exists for this email, a password reset link has been sent.');
        });

        it('should return 400 if email is missing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({});

            expect(response.status).toBe(400);
        });
    });

    // ==========================================
    // 9. RESET PASSWORD ROUTE INTEGRATION TESTS
    // ==========================================
    describe('POST /api/v1/auth/reset-password', () => {

        it('should return 200 and reset password with valid token (Full Flow)', async () => {
            // STEP 1: Register a user
            const testEmail = `resetflow${Math.random()}@test.com`;
            await request(app)
                .post('/api/v1/auth/register')
                .send({
                    name: 'Reset Flow Tester',
                    email: testEmail,
                    password: 'oldPassword123'
                });

            // STEP 2: Generate a reset token manually (same way the service does)
            const jwt = require('jsonwebtoken');
            const User = require('../../src/models/UserPrisma').UserModel;

            const user = await User.findByEmail(testEmail);
            const secret = process.env.JWT_SECRET + user.passwordHash;
            const resetToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

            // STEP 3: Reset the password
            const resetRes = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({ token: resetToken, newPassword: 'BrandNewPassword123' });

            expect(resetRes.status).toBe(200);
            expect(resetRes.body.message).toBe('Password reset successful.');

            // STEP 4: Verify old password fails
            const oldLoginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: testEmail, password: 'oldPassword123' });

            expect(oldLoginRes.status).toBe(401);

            // STEP 5: Verify new password works
            const newLoginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({ email: testEmail, password: 'BrandNewPassword123' });

            expect(newLoginRes.status).toBe(200);
            expect(newLoginRes.body.token).toBeDefined();
        });

        it('should return 400 if token is missing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({ newPassword: 'SomePassword123' });

            expect(response.status).toBe(400);
        });

        it('should return 400 if newPassword is missing', async () => {
            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({ token: 'some-token' });

            expect(response.status).toBe(400);
        });

        it('should return 400 if token is invalid/garbage', async () => {
            const response = await request(app)
                .post('/api/v1/auth/reset-password')
                .send({ token: 'garbage-fake-token', newPassword: 'SomePassword123' });

            expect(response.status).toBe(400);
        });
    });
});
