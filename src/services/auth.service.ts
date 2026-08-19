import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'
import { ENV } from '../config/env'


export const registerUser = async (userData: any) => {
    // 1. Destructure the data (extract specific fields)
    const { name, email, password } = userData;

    // 2. Check if the user already exists in the database
    const existingUser = await User.findOne({ email });

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
    const user = await User.create({
        name,
        email,
        passwordHash: hashedPassword,
    });

    // 6. Return sanitized user data (don't send the passwordHash back!)
    return {
        _id: user._id,
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
    const user = await User.findOne({ email }).select('+passwordHash');
    
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
        { userId: user._id }, 
        ENV.JWT_SECRET as string, 
        { expiresIn: '7d' } // Token expires in 7 days
    );

    // 4. Return the token and the user data (WITHOUT the password)
    return {
        token,
        user: {
            _id: user._id,
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
    const user = await User.findById(userId).select('-passwordHash');

    // WHAT: If the token is valid, but the user was deleted from the database yesterday, we must throw an error.
    if (!user) {
        const error: any = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    return user;
};


// ==========================================
// 4. UPDATE USER PROFILE WORKER
// ==========================================
export const updateUserById = async (userId: string, updateData: { name: string }) => {
    // WHY/PURPOSE: This Worker takes the new data and updates the user in the database.
    // HOW: We use Mongoose's findByIdAndUpdate.
    // WHAT: { new: true } tells MongoDB to return the UPDATED user, not the old one.
    // WHAT: runValidators ensures they didn't pass a blank name.
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name: updateData.name }, // We only allow 'name' to be updated for now!
        { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
        // any lets the variable holds anytype used to bypass 
        // typescript type checking
       // any skips type checking   
        const error: any = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }
    return updatedUser;
};
