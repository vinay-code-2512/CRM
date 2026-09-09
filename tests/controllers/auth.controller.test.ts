import db from '../../src/lib/prisma';

// We import the Controller we want to test
// Update this line:
import { registerController, loginController, logoutController, getProfileController, 
    updateProfileController, sendVerificationController, verifyEmailController,
     forgotPasswordController, resetPasswordController } 
     from "../../src/controllers/auth.controller";

// Add this line so we can mock the service functions:
import * as authService from '../../src/services/auth.service';

// We import the User model to clean up the database between tests
import { UserModel as User } from '../../src/models/UserPrisma';
import { NextFunction } from "express";


// A Jest function. Why? We need to group all our tests for this 
// specific Controller into one block. This makes the terminal output
//  organized. When? It runs when Jest starts reading the file.
describe('Auth Controller - registerController', () => {

    beforeAll(async () => {
        try { await db.connect(); } catch(e) {}
    });

    afterEach(async () => {
        await (db.orm as any).public.User.deleteAll();
    });

    // Tests will go here...
    // TEST 1: Does the controller send a 201 Created status?
    it('should return 201 on successful registration', async () => {

        // 1. Create a fake 'req' object containing the body
        // 'as Request' tells TypeScript to treat our fake object as a real Express Request
        const req = {
            body: {
                name: 'Test Controller',
                email: 'controller@example.com',
                password: 'password123'
            }
        } as any; // (Using 'any' for simplicity in our fake object)

        // 2. Create a fake 'res' object with spy functions
        // We use jest.fn() so we can spy on these functions later

        // Remember in our Controller we chained methods like this: res.status(201).json(newUser).
        // If our fake res.status function returns undefined, the chain breaks and .json() crashes.
        // .mockReturnThis() tells our spy function: "When you are called,
        //  return the res object itself, so the next function in the chain can be called."

        //  // 2. Create a fake 'res' object. 
        // We use jest.fn() like a "Hidden Camera". It does nothing, but it secretly
        // records what the Controller does (e.g. what status code it sends). 
        // Later, we check the camera footage using .toHaveBeenCalledWith()
        // .mockReturnThis() ensures res.status(201).json() chaining doesn't crash.

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        // 3. Create a fake 'next' function
        const next = jest.fn();

        // 4. Call the controller and pass our fake objects!
        await registerController(req, res, next);

        // 5. Verify the response status is 201
        // We ask the spy: "Were you called with the number 201?"
        expect(res.status).toHaveBeenCalledWith(201);
    });

    // TEST 2: Does the controller send the safe user data back?
    it('should return sanitized user data in response', async () => {

        // 1. Setup our fake request
        const req = {
            body: {
                name: 'Data Test',
                email: 'data@example.com',
                password: 'password123'
            }
        } as any;

        // 2. Setup our fake response with hidden cameras
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        const next = jest.fn();

        // 3. Call the Controller
        await registerController(req, res, next);

        // 4. Check the camera on res.json
        // It should AT LEAST contain the name and email we sent
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Data Test',
                email: 'data@example.com'
            })
        );


        // This is how you open the camera's raw footage. mock.calls 
        // is an array of every time the spy was called. [0] gets the
        //  first time it was called. The second [0] gets the first 
        // argument that was passed. This gives us the exact newUser object
        // that the Controller sent.

        // 5. Look exactly at what was sent in the first call to res.json()
        // .mock.calls[0][0] means: [first time the function was called][first argument passed to it]
        const sentData = res.json.mock.calls[0][0];

        // 6. Ensure passwordHash is completely missing from the response!
        expect(sentData).not.toHaveProperty('passwordHash');
    });

    // TEST 3: Does the controller catch errors and pass them to next()?
    it('should pass errors to next() if something goes wrong', async () => {

        // 1. Force the database to already have this email
        await User.create({
            name: 'Existing User',
            email: 'duplicate@example.com',
            passwordHash: 'hashedpassword'
        });

        // 2. Setup a fake request trying to use the SAME email
        const req = {
            body: {
                name: 'New User',
                email: 'duplicate@example.com',
                password: 'password123'
            }
        } as any;

        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any;

        // 3. Put a Hidden Camera on the 'next' function!
        const next = jest.fn();

        // 4. Call the Controller
        await registerController(req, res, next);

        // 5. Check the 'next' camera. 
        // Because the email is duplicate, the Service threw an error.
        // The Controller should have caught it and called next(error).
        expect(next).toHaveBeenCalled();

        // 6. Look exactly at what error the Controller passed to next()
        // .mock.calls[0][0] gets the exact error object that was passed
        const passedError = next.mock.calls[0][0];

        // Ensure it is a real Error object
        expect(passedError).toBeInstanceOf(Error);
        // Ensure the error message matches what the Service threw
        expect(passedError.message).toBe('User already exists with this email');
    });


    describe('loginController', () => {

        beforeEach(async () => {
            // HOW: We need a fake user in the RAM database to test logging in
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            await User.create({
                name: 'Controller Test',
                email: 'controller@example.com',
                passwordHash: hashedPassword
            });
        });

        // WHAT: Test 1 - The Happy Path
        it('should return 200 and user data on successful login', async () => {
            // HOW: We create a fake HTTP Request object that the Manager will receive
            const req = {
                body: {
                    email: 'controller@example.com',
                    password: 'password123'
                }
            } as any;

            // HOW: We create fake Response tools for the Manager to use
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            // PURPOSE: Execute the Manager (Controller)
            await loginController(req, res, next);

            // SECURITY CHECK: Ensure the Manager correctly responded with 200 OK
            expect(res.status).toHaveBeenCalledWith(200);

            // SECURITY CHECK: Ensure the Manager passed the correct data to the client
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: expect.any(String),
                    user: expect.objectContaining({ email: 'controller@example.com' })
                })
            );
        });

        // WHAT: Test 2 - The Unhappy Path (Global Error Handler Check)
        it('should pass errors to the global error handler', async () => {
            const req = { body: { email: 'bad@email.com', password: 'wrong' } } as any;
            const res = {} as any;
            const next = jest.fn() as any;

            // PURPOSE: Execute the Manager (Controller)
            await loginController(req, res, next);

            // SECURITY CHECK: Ensure the Manager caught the error and slid it down the pipe!
            expect(next).toHaveBeenCalledWith(expect.any(Error));
            expect(next.mock.calls[0][0].statusCode).toBe(401);
        });
    });

    // ==========================================
    // 3. LOGOUT CONTROLLER TESTS
    // ==========================================
    describe('logoutController', () => {

        // WHAT: Test 1 - The Happy Path
        // WHY: The Manager must immediately return 200 OK without talking to the Worker.
        it('should return 200 and a success message on logout', async () => {

            // HOW: We fake an empty envelope (no data needed for logout)
            const req = {} as any;

            // HOW: We create fake 'spy cameras' for the Manager's megaphone
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            // HOW: We fake the error slide (even though we don't expect errors here)
            const next = jest.fn() as any;

            // PURPOSE: Execute the Manager (Controller) directly!
            // Notice we DID NOT hypnotize (mock) the Worker, because the Manager doesn't even call the Worker!
            await logoutController(req, res, next);

            // SECURITY CHECK: Did the Manager check the spy camera and officially say 200 OK?
            expect(res.status).toHaveBeenCalledWith(200);

            // SECURITY CHECK: Did the Manager send the exact success message back to the client?
            expect(res.json).toHaveBeenCalledWith({
                message: 'Logout Successfully'
            });
        });

    });

    // ==========================================
    // 4. GET PROFILE CONTROLLER TESTS
    // ==========================================
    describe('getProfileController', () => {
        it('should return 200 and the user profile data', async () => {
            // HOW: First, we need to create a real user in the test database
            const testUser = await User.create({
                name: 'Controller Tester',
                email: 'controller@test.com',
                passwordHash: 'hashed123'
            });

            // HOW: We fake the incoming request, but THIS TIME, we pretend the Bouncer 
            // already did his job and successfully attached the ID to req.user!
            const req = {
                user: { userId: testUser.id.toString() }
            } as any;

            // HOW: Fake the response object (spy cameras)
            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            // PURPOSE: Execute the Manager
            await getProfileController(req, res, next);

            // SECURITY CHECK: Did it return 200 OK?
            expect(res.status).toHaveBeenCalledWith(200);

            // SECURITY CHECK: Did it return the user data without the password?
            const jsonCallArgs = res.json.mock.calls[0][0]; // Grabs the first argument of the first time it was called
            expect(jsonCallArgs.user.name).toBe('Controller Tester');
            expect(jsonCallArgs.user.passwordHash).toBeUndefined();
        });
    });

    // ==========================================
    // 5. UPDATE PROFILE CONTROLLER TESTS
    // ==========================================
    describe('updateProfileController', () => {
        it('should return 200 and the updated user data', async () => {
            const testUser = await User.create({
                name: 'Old Name',
                email: 'update@test.com',
                passwordHash: 'hashed123'
            });

            // HOW: Fake the request, providing the Bouncer's stamp AND the new body data
            const req = {
                user: { userId: testUser.id.toString() },
                body: { name: 'Brand New Name' }
            } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await updateProfileController(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);

            const jsonCallArgs = res.json.mock.calls[0][0];
            expect(jsonCallArgs.message).toBe('Profile updated successfully');
            expect(jsonCallArgs.user.name).toBe('Brand New Name');
        });
    });


    // ==========================================
    // 6. SEND VERIFICATION CONTROLLER TESTS
    // ==========================================
    describe('sendVerificationController', () => {
        let testUserId: string;

        beforeEach(async () => {
            const user = await User.create({
                name: 'Verify Tester',
                email: 'verify@controller.com',
                passwordHash: 'hashed123'
            });
            testUserId = user.id.toString();
        });

        it('should return 200 and a verification token', async () => {
            // HOW: Fake the request envelope — the Bouncer already put userId inside!
            const req = { user: { userId: testUserId } } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            // PURPOSE: Execute the Manager directly!
            await sendVerificationController(req, res, next);

            // SECURITY CHECK: Must return 200 OK
            expect(res.status).toHaveBeenCalledWith(200);

            // SECURITY CHECK: Must return the raw token
            const jsonCallArgs = res.json.mock.calls[0][0];
            expect(jsonCallArgs.message).toBe('Verification email sent successfully');
            expect(jsonCallArgs.verificationToken).toBeDefined();
            expect(typeof jsonCallArgs.verificationToken).toBe('string');
        });

        it('should call next(error) if user does not exist', async () => {
            // HOW: Use a fake ID that doesn't exist in the database
            const req = { user: { userId: "999999" } } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await sendVerificationController(req, res, next);

            // SECURITY CHECK: The error must slide down to the Global Error Handler
            expect(next).toHaveBeenCalled();
        });
    });

    // ==========================================
    // 7. VERIFY EMAIL CONTROLLER TESTS
    // ==========================================
    describe('verifyEmailController', () => {
        let testUserId: string;

        beforeEach(async () => {
            const user = await User.create({
                name: 'Verify Tester',
                email: 'verify@controller.com',
                passwordHash: 'hashed123'
            });
            testUserId = user.id.toString();
        });

        it('should return 200 and mark email as verified', async () => {
            // STEP 1: Generate a real token first (need the service for this)
            const { generateEmailVerificationToken } = require('../../src/services/auth.service');
            const rawToken = await generateEmailVerificationToken(testUserId);

            // STEP 2: Fake the request — token comes from query string
            const req = { query: { token: rawToken } } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await verifyEmailController(req, res, next);

            // SECURITY CHECK: Must return 200 OK
            expect(res.status).toHaveBeenCalledWith(200);

            // SECURITY CHECK: Must confirm verification
            const jsonCallArgs = res.json.mock.calls[0][0];
            expect(jsonCallArgs.message).toBe('Email verified successfully');
            expect(jsonCallArgs.user.isEmailVerified).toBe(true);
        });

        it('should call next(error) if no token is provided', async () => {
            // HOW: Send an empty query string — no token!
            const req = { query: {} } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await verifyEmailController(req, res, next);

            // SECURITY CHECK: The error must slide to the Global Error Handler
            expect(next).toHaveBeenCalled();
        });

        it('should call next(error) if token is invalid', async () => {
            // HOW: Send a completely fake token
            const req = { query: { token: 'fake-garbage-token' } } as any;

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn()
            } as any;

            const next = jest.fn() as any;

            await verifyEmailController(req, res, next);

            // SECURITY CHECK: Must reject the fake token
            expect(next).toHaveBeenCalled();
        });
    });

    // ==========================================
    // 8. FORGOT PASSWORD CONTROLLER TESTS
    // ==========================================
    describe('forgotPasswordController', () => {
        it('should return 200 and success message when service succeeds', async () => {
            const req = { body: { email: 'test@example.com' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await forgotPasswordController(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'If an account exists for this email, a password reset link has been sent.' });
        });

        it('should call next(error) if email is missing', async () => {
            const req = { body: {} } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await forgotPasswordController(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].message).toBe('Email is required');
        });
    });

    // ==========================================
    // 9. RESET PASSWORD CONTROLLER TESTS
    // ==========================================
    describe('resetPasswordController', () => {
        it('should return 400 when invalid token is provided', async () => {
            const req = { body: { token: 'valid-token', newPassword: 'SecurePassword123' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await resetPasswordController(req, res, next);

            // Expect it to fail since the token is actually invalid in the real DB
            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].message).toBe('Invalid or expired reset token');
        });

        it('should call next(error) if token or newPassword is missing', async () => {
            const req = { body: { token: 'valid-token' } } as any;
            const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
            const next = jest.fn() as any;

            await resetPasswordController(req, res, next);

            expect(next).toHaveBeenCalled();
            expect(next.mock.calls[0][0].message).toBe('Token and new password are required');
        });
    });
});
