import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    isEmailVerified: boolean;
    profileData?: Record<string, any>;
    createdAt: Date;   
    updatedAt: Date
}

// 1. VARIABLE: We declare 'UserSchema' to store the result.
// 2. CLASS INSTANTIATION: 'new Schema' builds a brand new object.
// 3. TYPESCRIPT LINK: '<IUser>' forces this schema to match our interface.
// 4. CONSTRUCTOR CALL: The '(' opens the function call.
const UserSchema = new Schema<IUser>(
    // ---------------------------------------------------------
    // ARGUMENT 1: The Field Definition Object
    // The '{' below opens the massive JavaScript object for our fields.
    {
        name: { // 'name' is a key. Its value is a nested object.
            type: String,     // Must be text
            required: true,   // Cannot save to database without a name
        },

        email: {
            type: String,     // Must be text
            required: true,   // Cannot save to database without an email
            unique: true,     // No two users can have the exact same email
            lowercase: true,  // Automatically converts "Test@Email.com" to "test@email.com"
        },

        passwordHash: {
            type: String,     // Must be text
            required: true,   // Cannot save without a password hash
        },

        isEmailVerified: {
            type: Boolean,    // True or False
            default: false,   // If not provided, automatically set it to false
        },

        profileData: {
            type: Object,     // A flexible object for future data (like phone number, avatar)
        }
        // The '}' below closes the first massive JavaScript object.
    },
    // ---------------------------------------------------------
    // The comma ',' separates Argument 1 from Argument 2.
    // ---------------------------------------------------------
    // ARGUMENT 2: The Options Object
    // The '{' below opens a second, smaller JavaScript object.
    {
        // Mongoose will automatically create 'createdAt' and 'updatedAt' dates for us
        timestamps: true
    }
    // The '}' below closes the second object.
    // The ')' below closes the 'new Schema(...)' function call.
);

// 1. MODEL COMPILATION: We use mongoose.model() to combine our Interface and our Schema.
// 2. NAME: 'User' tells Mongoose to connect to the 'users' collection in the database.
// 3. EXPORT DEFAULT: We make this Model the primary export of the entire file.
const User = mongoose.model<IUser>('User', UserSchema);

export default User;
