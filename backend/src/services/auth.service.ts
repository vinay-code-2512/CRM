import { UserModel } from '../models/UserPrisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import { ENV } from '../config/env'
import crypto from 'crypto'


export const registerUser = async (userData: any) => {
    // 1. Destructure the data (extract specific fields)
    const { name, email, password } = userData;

    // 2. Check if the user already exists in the database
    const existingUser = await UserModel.findByEmail(email);

    // 3. If they exist, stop and throw an error
       if (existingUser) {
        const error: any = new Error('User already exists with this email');
        error.statusCode = 400; // Tell the Global Error Handler 
        // this is a 400 Bad Request!
        throw error;
    }


    // 4. Hash the password
    // '10' is the "salt rounds" - determines how slow and secure the hash will be.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create and save the new user in the database
    const user = await UserModel.create({
        name,
        email,
        passwordHash: hashedPassword,
    });

    // 6. Return sanitized user data (don't send the passwordHash back!)
    return {
        _id: user.id.toString(),
        name: user.name,
        email: user.email,
    };
};


// Login Service

export const loginUser = async (userData: any) => {
    const { email, password } = userData;

    // 1. CHECK EMAIL: Does this user exist?
    // We add `.select('+passwordHash')` because in Sprint 0, we told Mongoose 
    // to HIDE the password by default. We need to explicitly ask for it now!
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
        const error: any = new Error('Invalid email or password');
        error.statusCode = 401; // 401 Unauthorized
        throw error;
    }

    // 2. CHECK PASSWORD: Do the passwords match?
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!isMatch) {
        const error: any = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    // 3. SUCCESS: Generate the JWT (The ID Card)
    // We put the user's _id inside the token so we know exactly who is logged in
    const token = jwt.sign(
        { userId: user.id.toString() }, 
        ENV.JWT_SECRET as string, 
        { expiresIn: '7d' } // Token expires in 7 days
    );

    // 4. Return the token and the user data (WITHOUT the password)
    return {
        token,
        user: {
            _id: user.id.toString(),
            name: user.name,
            email: user.email
        }
    };
};


// ==========================================
// 3. GET USER BY ID WORKER
// ==========================================
export const getUserById = async (userId: string) => {
    // WHY/PURPOSE: This Worker takes the ID stamped by the Bouncer and finds the user in the database.
    // HOW: We use Mongoose's findById.
    // SECURITY CHECK: We use .select('-passwordHash') to ensure the database NEVER returns the password back to the Manager!
    const user = await UserModel.findById(Number(userId));

    // WHAT: If the token is valid, but the user was deleted from the database yesterday, we must throw an error.
    if (!user) {
        const error: any = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    const { passwordHash, ...safeUser } = user;
    return {
        ...safeUser,
        _id: safeUser.id.toString()
    };
};


// ==========================================
// 4. UPDATE USER PROFILE WORKER
// ==========================================
export const updateUserById = async (userId: string, updateData: { name: string }) => {
    // WHY/PURPOSE: This Worker takes the new data and updates the user in the database.
    // HOW: We use Mongoose's findByIdAndUpdate.
    // WHAT: { new: true } tells MongoDB to return the UPDATED user, not the old one.
    // WHAT: runValidators ensures they didn't pass a blank name.
    const updatedUser = await UserModel.updateById(Number(userId), { name: updateData.name });

    if (!updatedUser) {
        // any lets the variable holds anytype used to bypass 
        // typescript type checking
       // any skips type checking   
        const error: any = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    
    const { passwordHash, ...safeUpdatedUser } = updatedUser;
    return {
        ...safeUpdatedUser,
        _id: safeUpdatedUser.id.toString()
    };
};


// ==========================================
// 5. GENERATE EMAIL VERIFICATION TOKEN WORKER
// ==========================================
export const generateEmailVerificationToken = async (userId: string) => {
    // WHY/PURPOSE: When a user registers (or requests a resend), we create a secret token
    // and email it to them. They click the link to prove they own the email.
    // STEP 1: Find the user in the database
    const user = await UserModel.findById(Number(userId));
    if (!user) {
        const error: any = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    // STEP 2: Generate a random token using Node.js built-in 'crypto' module
    // HOW: crypto.randomBytes(32) creates 32 random bytes, then we convert to a readable hex string
    // WHAT: This produces something like "a3f5b8c1d2e4..." — a unique, unguessable string
    const rawToken = crypto.randomBytes(32).toString('hex');
    // STEP 3: Hash the token before saving to the database
    // WHY: Same reason we hash passwords — if the database leaks, the attacker can't use stolen tokens!
    // HOW: crypto.createHash('sha256') creates a one-way hash
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    // STEP 4: Save the hashed token and expiry (24 hours from now) to the user's record
    await UserModel.updateById(user.id, {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    // STEP 5: Return the RAW (unhashed) token — this is what we send in the email link!
    // WHY: The user clicks the link with the raw token. We then hash it again and compare it to the database.
    return rawToken;
}



// ==========================================
// 6. VERIFY EMAIL TOKEN WORKER
// ==========================================
export const verifyEmailToken = async (token: string) => {
    // WHY/PURPOSE: When the user clicks the verification link, this Worker checks if the token is valid.
    // STEP 1: Hash the incoming raw token (from the URL) so we can compare it to the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    // STEP 2: Find a user whose token matches AND whose token hasn't expired yet
    // HOW: $gt means "greater than" — we check if the expiry date is still in the future!
    const user = await UserModel.findByVerificationToken(hashedToken);
    
    // STEP 3: If no user found, the token is either invalid or expired
    if (!user) {
        const error: any = new Error('Invalid or expired verification token');
        error.statusCode = 400;
        throw error;
    }
    // STEP 4: Mark the email as verified and clean up the token fields
    const updatedUser = await UserModel.updateById(user.id, {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null
    });

    if (!updatedUser) {
        const error: any = new Error('Failed to update user');
        error.statusCode = 500;
        throw error;
    }

    // STEP 5: Return the verified user
    return {
        ...updatedUser,
        _id: updatedUser.id.toString()
    };
};


// ==========================================
// 7. GENERATE PASSWORD RESET TOKEN WORKER
// ==========================================
export const generatePasswordResetToken = async (email: string) => {
    // SECURITY CHECK: Missing email
    if (!email) {
        const error: any = new Error('Email is required');
        error.statusCode = 400;
        throw error;
    }

    // SECURITY CHECK: Basic format validation 
    // (Zod catches this in the controller, but good to have double validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        const error: any = new Error('Invalid email format');
        error.statusCode = 400;
        throw error;
    }

    // ZERO-KNOWLEDGE RESPONSE:
    // We always return this exact message regardless of whether the user exists.
    // This strictly prevents "email enumeration" (hackers checking if an email is registered).
    const successResponse = {
        message: 'If an account exists for this email, a password reset link has been sent.'
    };

    // HOW: Find the user. We need +passwordHash because we use it for the token secret!
    const user = await UserModel.findByEmail(email);
    
    if (!user) {
        // Stop silently and return the generic message.
        return successResponse;
    }

    // STATELESS TOKEN APPROACH:
    // We tie the JWT secret to the user's CURRENT password hash.
    const secret = ENV.JWT_SECRET + user.passwordHash;

    // Create a short-lived token (15 mins)
    const resetToken = jwt.sign(
        { userId: user.id.toString() },
        secret,
        { expiresIn: '15m' }
    );

    // MOCK EMAIL DELIVERY
    console.log(`\n📧 [MOCK EMAIL] Password Reset Requested for ${email}`);
    console.log(`🔗 Link: http://localhost:3000/reset-password?token=${resetToken}\n`);

    return successResponse;
};


// ==========================================
// 8. RESET PASSWORD WORKER
// ==========================================
export const resetPassword = async (token: string, newPassword: string) => {
    // SECURITY CHECK: Ensure token and new password are provided
    if (!token || !newPassword) {
        const error: any = new Error('Token and new password are required');
        error.statusCode = 400;
        throw error;
    }

    // SECURITY CHECK: Password strength validation
    if (newPassword.length < 6) {
        const error: any = new Error('Password must be at least 6 characters long');
        error.statusCode = 400;
        throw error;
    }

    try {
        // STEP 1: Decode the token WITHOUT verifying the signature yet
        // We need the userId inside it so we can fetch the user's hash.
        const decoded = jwt.decode(token) as { userId: string } | null;
        
        if (!decoded || !decoded.userId) {
            throw new Error('Invalid token structure');
        }

        // STEP 2: Fetch the user and get their CURRENT password hash
        const user = await UserModel.findById(Number(decoded.userId));
        if (!user) {
            throw new Error('User not found');
        }

        // STEP 3: Reconstruct the specific dynamic secret used to sign THIS user's tokens
        const secret = ENV.JWT_SECRET + user.passwordHash;

        // STEP 4: Verify the token using this exact secret
        // If the password changed since token creation, this will throw an error!
        // If it's expired, this will throw an error!
        jwt.verify(token, secret);

        // STEP 5: Token is completely valid. Hash the NEW password.
        const salt = await bcrypt.genSalt(10);
        const newHashedPassword = await bcrypt.hash(newPassword, salt);

        // STEP 6: Save the new password.
        // Because the passwordHash just changed, the previous token is now permanently invalid!
        await UserModel.updateById(user.id, { passwordHash: newHashedPassword });

        return { message: 'Password reset successful.' };
        
    } catch (err: any) {
        // We catch all JWT verification errors (expired, invalid signature, fake user)
        // and throw a generic 400 error to the Global Error Handler.
        const error: any = new Error('Invalid or expired reset token');
        error.statusCode = 400;
        throw error;
    }
};
