// Import mongoose for database connection management
import mongoose from 'mongoose';

// Import MongoMemoryServer for temporary in-memory database
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import the function we are testing
import { registerUser, loginUser, getUserById, updateUserById, generateEmailVerificationToken, verifyEmailToken, generatePasswordResetToken, resetPassword } from '../../src/services/auth.service';

import bcrypt from 'bcryptjs'
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
// Import the User model to directly verify database state
import User from '../../src/models/User';

// Group all Registration Service tests together
describe('Auth Service - registerUser', () => {

    // Hold the in-memory MongoDB server instance
    let mongoServer: MongoMemoryServer;

    // Start in-memory MongoDB ONCE before all tests
    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
    });

    // Clean up after ALL tests finish
    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
        await mongoServer.stop();
    });

    // Wipe all data after EACH test for isolation
    afterEach(async () => {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    });

   // TEST 1: Does registerUser successfully create a user with valid data?
    // This is the "happy path" — correct input, expected output
    it('should register a user successfully with valid data', async () => {
        // Call the Service function directly — no HTTP, no Express, no routes
        // We pass an object with name, email, and password
        const result = await registerUser({
            name: 'Test User',
            email: 'test@example.com',
            password: 'SecurePassword123'
        });

        // Verify: The function should return an object with _id, name, and email
        expect(result).toHaveProperty('_id');
        expect(result.name).toBe('Test User');
        expect(result.email).toBe('test@example.com');
    });

    // TEST 2: Is the password hashed before being stored in the database?
    // We check the DATABASE directly (not the return value) to verify
    it('should hash the password before saving to database', async () => {
        const plainPassword = 'SecurePassword123';
        // Register the user through our Service
        await registerUser({
            name: 'Hash Test User',
            email: 'hash@example.com',
            password: plainPassword
        });
        // Go directly to the database and find the user we just created
        // This bypasses the Service's return — we're checking what's ACTUALLY stored
        const userInDb = await User.findOne({ email: 'hash@example.com' });
        // The passwordHash in the database should NOT equal the plain password
        // If they're equal, it means hashing failed — a critical security flaw
        // ! means not null
        expect(userInDb!.passwordHash).not.toBe(plainPassword);
        // bcrypt hashes always start with '$2a$' or '$2b$'
        // This proves it's a real bcrypt hash, not some random transformation
        expect(userInDb!.passwordHash).toMatch(/^\$2[ab]\$/);
    });

        // TEST 3: Is the plain password stored anywhere in the database document?
    // Even if passwordHash is correct, we must ensure 'password' field doesn't exist
    it('should NOT store plain password in the database', async () => {

        await registerUser({
            name: 'Plain Check User',
            email: 'plain@example.com',
            password: 'MySecret456'
        });

        // Fetch the raw document from MongoDB
        const userInDb = await User.findOne({ email: 'plain@example.com' });

        // The document should have 'passwordHash' (the hashed version)
        expect(userInDb!.passwordHash).toBeDefined();

        // The document should NOT have a 'password' field anywhere
        // We cast to 'any' because TypeScript doesn't know about fields
        // that aren't in our interface — but MongoDB might still store them
        expect((userInDb as any).password).toBeUndefined();
    });

     // TEST 4: Does registerUser reject a duplicate email?
    // Our Service checks User.findOne({ email }) — if found, it throws an error
    it('should throw an error if email already exists', async () => {

        // First registration — this should succeed
        await registerUser({
            name: 'First User',
            email: 'duplicate@example.com',
            password: 'Password111'
        });

        // Second registration with the SAME email — this should FAIL
        let error: any;
        try {
            await registerUser({
                name: 'Second User',
                email: 'duplicate@example.com',
                password: 'Password222'
            });
        } catch (err) {
            error = err;
        }

        // An error should have been thrown
        expect(error).toBeDefined();

        // The error message should be the one we wrote in our Service
        expect(error.message).toBe('User already exists with this email');
    });

     // TEST 5: Does the returned data expose passwordHash?
    // The Service should return ONLY safe, non-sensitive fields
    it('should NOT include passwordHash in the returned data', async () => {

        const result = await registerUser({
            name: 'Safe Return User',
            email: 'safe@example.com',
            password: 'SafePassword789'
        });

        // The result should have these safe fields
        expect(result).toHaveProperty('_id');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('email');

        // The result should NOT have passwordHash
        // This is what the Controller will eventually send to the client
        // Sensitive data must never leave the Service layer
        expect(result).not.toHaveProperty('passwordHash');
    });

    describe('loginUser', () => {
        
        // WHAT: A Jest Hook that runs before every test in this block
        // WHY: We need a fake user in the RAM database to test logging in
        beforeEach(async () => {
            // HOW: Generate salt and hash 'password123' so the DB has a valid hash
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            
            // PURPOSE: Inject the fake user into MongoDB
            await User.create({
                name: 'Vinay',
                email: 'vinay.com',
                passwordHash: hashedPassword
            });
        });

        // WHAT: Test 1 - The Happy Path
        it('should login successfully and return a token', async () => {
            // HOW: Call the Worker directly (bypassing the Controller)
            const result = await loginUser({
                email: 'vinay.com',
                password: 'password123'
            });

            // PURPOSE: Verify the Worker generated the ID Card (JWT)
            expect(result).toHaveProperty('token');
            expect(typeof result.token).toBe('string');
            
            // SECURITY CHECK: Ensure the Worker returns safe data and NO password hash
            expect(result.user.email).toBe('vinay.com');
            expect(result.user).not.toHaveProperty('passwordHash');
        });

        // WHAT: Test 2 - The Unhappy Path
        it('should throw 401 error if password is wrong', async () => {
            // HOW: Attempt to login but purposely type the wrong password
            const loginAttempt = loginUser({
                email: 'vinay.com',
                password: 'wrongPassword'
            });

            // PURPOSE: Strictly check that the Worker throws the exact generic message
            await expect(loginAttempt).rejects.toThrow('Invalid email or password');
            
            // NEED: Catch the error manually to prove the status code is exactly 401
            try {
                await loginAttempt;
            } catch (error: any) {
                expect(error.statusCode).toBe(401); 
            }
        });
    });
    
    // ==========================================
    // 3. GET USER AND UPDATE USER WORKER TESTS
    // ==========================================
    describe('Profile Service Workers', () => {
        let testUserId: string;

        // WHAT: Run this before every test in this block
        beforeEach(async () => {
            // HOW: Create a dummy user in the in-memory database
            const user = await User.create({
                name: 'Profile Tester',
                email: 'profile@test.com',
                passwordHash: 'hashed123'
            });
            // PURPOSE: Save the ID so we can look it up in the tests!
            testUserId = user._id.toString();
        });

        describe('getUserById', () => {
            it('should return user data without the passwordHash', async () => {
                // HOW: Hand the Worker the ID
                const user = await getUserById(testUserId);

                // SECURITY CHECK: Did it find the user?
                expect(user).toBeDefined();
                expect(user.name).toBe('Profile Tester');
                
                // SECURITY CHECK: Is the password safely hidden?
                expect((user as any).passwordHash).toBeUndefined();
            });

            it('should throw a 404 error if user does not exist', async () => {
                // HOW: Generate a fake but correctly formatted MongoDB ID
                const fakeId = new mongoose.Types.ObjectId().toString();

                // SECURITY CHECK: Ensure it throws the 404 Error
                await expect(getUserById(fakeId)).rejects.toThrow('User not found');
            });
        });

        describe('updateUserById', () => {
            it('should update the name and return fresh data', async () => {
                // HOW: Hand the Worker the ID and the new name
                const updatedUser = await updateUserById(testUserId, { name: 'New Awesome Name' });

                // SECURITY CHECK: Did the name actually change?
                expect(updatedUser.name).toBe('New Awesome Name');
                
                // SECURITY CHECK: Is the password still hidden on the returned object?
                expect((updatedUser as any).passwordHash).toBeUndefined();
            });

            it('should throw a 404 error if updating a deleted user', async () => {
                const fakeId = new mongoose.Types.ObjectId().toString();

                await expect(updateUserById(fakeId, { name: 'Hacker Name' })).rejects.toThrow('User not found');
            });
        });
    });

    // ==========================================
    // 4. EMAIL VERIFICATION WORKER TESTS
    // ==========================================
    describe('Email Verification Workers', () => {
        let testUserId: string;

        // WHAT: Before every test, create a fresh unverified user
        beforeEach(async () => {
            const user = await User.create({
                name: 'Email Tester',
                email: 'verify@test.com',
                passwordHash: 'hashed123',
                isEmailVerified: false
            });
            testUserId = user._id.toString();
        });

        describe('generateEmailVerificationToken', () => {

            it('should return a raw token string', async () => {
                // HOW: Call the Worker with the user's ID
                const rawToken = await generateEmailVerificationToken(testUserId);

                // WHAT: The raw token must be a non-empty string
                expect(rawToken).toBeDefined();
                expect(typeof rawToken).toBe('string');
                expect(rawToken.length).toBeGreaterThan(0);
            });

            it('should save a HASHED token to the database (not the raw one)', async () => {
                // HOW: Generate the token
                const rawToken = await generateEmailVerificationToken(testUserId);

                // HOW: Manually hash the raw token the same way the Worker does
                const expectedHash = crypto.createHash('sha256').update(rawToken).digest('hex');

                // HOW: Go directly to the database and check what was stored
                const userInDb = await User.findById(testUserId);

                // SECURITY CHECK: The stored token must be the HASH, not the raw token!
                expect(userInDb!.emailVerificationToken).toBe(expectedHash);
                expect(userInDb!.emailVerificationToken).not.toBe(rawToken);
            });

            it('should save an expiry date in the future', async () => {
                // HOW: Generate the token
                await generateEmailVerificationToken(testUserId);

                // HOW: Check the database
                const userInDb = await User.findById(testUserId);

                // WHAT: The expiry must exist and be in the future
                expect(userInDb!.emailVerificationExpires).toBeDefined();
                expect(userInDb!.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
            });

            it('should throw 404 if user does not exist', async () => {
                const fakeId = new mongoose.Types.ObjectId().toString();

                await expect(generateEmailVerificationToken(fakeId)).rejects.toThrow('User not found');
            });
        });

        describe('verifyEmailToken', () => {

            it('should verify the user and set isEmailVerified to true', async () => {
                // STEP 1: Generate a token (this saves the hash to DB)
                const rawToken = await generateEmailVerificationToken(testUserId);

                // STEP 2: Call verifyEmailToken with the RAW token (simulating clicking the link)
                const verifiedUser = await verifyEmailToken(rawToken);

                // SECURITY CHECK: isEmailVerified must now be true!
                expect(verifiedUser.isEmailVerified).toBe(true);
            });

            it('should clean up the token fields after verification', async () => {
                // STEP 1: Generate a token
                const rawToken = await generateEmailVerificationToken(testUserId);

                // STEP 2: Verify the email
                await verifyEmailToken(rawToken);

                // STEP 3: Check the database directly
                const userInDb = await User.findById(testUserId);

                // SECURITY CHECK: Token fields must be wiped clean!
                expect(userInDb!.emailVerificationToken).toBeUndefined();
                expect(userInDb!.emailVerificationExpires).toBeUndefined();
            });

            it('should throw 400 if token is invalid', async () => {
                // HOW: Pass a completely fake token
                await expect(verifyEmailToken('totally-fake-token')).rejects.toThrow('Invalid or expired verification token');
            });

            it('should throw 400 if token is expired', async () => {
                // STEP 1: Generate a token
                const rawToken = await generateEmailVerificationToken(testUserId);

                // STEP 2: Manually set the expiry to the PAST (simulate 24 hours passing)
                await User.findByIdAndUpdate(testUserId, {
                    emailVerificationExpires: new Date(Date.now() - 1000) // 1 second in the past!
                });

                // STEP 3: Try to verify — should fail because it's expired!
                await expect(verifyEmailToken(rawToken)).rejects.toThrow('Invalid or expired verification token');
            });
        });
    }); 


    // ==========================================
    // 5. PASSWORD RESET TESTS (US-1.5 & US-1.6)
    // ==========================================
    describe('Password Reset Flows', () => {
        let testUserId: string;
        let testEmail: string;

        // Setup: Create a fresh user for password tests
        beforeEach(async () => {
            testEmail = `reset${Math.random()}@test.com`;
            const user = await User.create({
                name: 'Reset Tester',
                email: testEmail,
                passwordHash: await bcrypt.hash('oldPassword123', 10),
                isEmailVerified: true
            });
            testUserId = user._id.toString();
        });

        describe('generatePasswordResetToken', () => {
            it('should return success message if email exists but NOT return the token', async () => {
                const response = await generatePasswordResetToken(testEmail);
                
                // SECURITY CHECK: We must return a generic message to prevent enumeration
                expect(response.message).toBe('If an account exists for this email, a password reset link has been sent.');
            });

            it('should return the EXACT SAME success message if email does NOT exist (Zero-Knowledge)', async () => {
                const response = await generatePasswordResetToken('nobody@test.com');
                
                // SECURITY CHECK: Do not leak "User not found"
                expect(response.message).toBe('If an account exists for this email, a password reset link has been sent.');
            });

            it('should throw 400 if email is missing', async () => {
                await expect(generatePasswordResetToken('')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Email is required'
                });
            });

            it('should throw 400 if email is invalid', async () => {
                await expect(generatePasswordResetToken('invalid-email')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Invalid email format'
                });
            });
        });

        describe('resetPassword', () => {
            let validResetToken: string;

            // HOW: We need to manually generate a valid reset token to test the reset function
            beforeEach(async () => {
                const user = await User.findById(testUserId);
                // The secret is tied to the current password hash!
                const secret = process.env.JWT_SECRET + user!.passwordHash;
                validResetToken = jwt.sign({ userId: testUserId }, secret, { expiresIn: '15m' });
            });

            it('should successfully reset the password with a valid token', async () => {
                const newPassword = 'NewSecurePassword123';
                
                const response = await resetPassword(validResetToken, newPassword);
                expect(response.message).toBe('Password reset successful.');

                // Verify the database actually updated
                const updatedUser = await User.findById(testUserId);
                
                // Old password should fail
                const oldPasswordMatch = await bcrypt.compare('oldPassword123', updatedUser!.passwordHash);
                expect(oldPasswordMatch).toBe(false);

                // New password should succeed
                const newPasswordMatch = await bcrypt.compare(newPassword, updatedUser!.passwordHash);
                expect(newPasswordMatch).toBe(true);
            });

            it('should automatically invalidate the token AFTER the password is changed', async () => {
                const newPassword = 'NewSecurePassword123';
                
                // STEP 1: Change the password
                await resetPassword(validResetToken, newPassword);

                // STEP 2: Try to use the EXACT SAME token again
                // SECURITY CHECK: It MUST fail because the password hash (and thus the secret) changed!
                await expect(resetPassword(validResetToken, 'AnotherPassword456')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Invalid or expired reset token'
                });
            });

            it('should throw 400 if token is missing', async () => {
                await expect(resetPassword('', 'newPass123')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Token and new password are required'
                });
            });

            it('should throw 400 if new password is missing', async () => {
                await expect(resetPassword(validResetToken, '')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Token and new password are required'
                });
            });

            it('should throw 400 if token is completely invalid/garbage', async () => {
                await expect(resetPassword('garbage.token.here', 'newPass123')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Invalid or expired reset token'
                });
            });

            it('should throw 400 if the reset token has expired', async () => {
                const user = await User.findById(testUserId);
                const secret = process.env.JWT_SECRET + user!.passwordHash;
                
                // HOW: Generate a token that expired 1 second ago
                const expiredToken = jwt.sign({ userId: testUserId }, secret, { expiresIn: '-1s' });

                await expect(resetPassword(expiredToken, 'newPass123')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Invalid or expired reset token'
                });
            });

            it('should throw 400 if the new password is too weak/invalid', async () => {
                // SECURITY CHECK: Must enforce minimum password length (e.g., 6 chars)
                await expect(resetPassword(validResetToken, '123')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Password must be at least 6 characters long'
                });
            });

            it('should throw 400 if the user in the token no longer exists', async () => {
                // HOW: Create a token for a fake user ID
                const fakeId = new mongoose.Types.ObjectId().toString();
                // We just use a random secret here since the user doesn't exist to have a hash
                const fakeUserToken = jwt.sign({ userId: fakeId }, process.env.JWT_SECRET + 'fakehash', { expiresIn: '15m' });

                await expect(resetPassword(fakeUserToken, 'newPass123')).rejects.toMatchObject({
                    statusCode: 400,
                    message: 'Invalid or expired reset token'
                });
            });
        });
    });

}); // This closes the main describe('Auth Service') block!
