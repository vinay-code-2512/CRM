// Import Express types for req, res, next
import { Request, Response, NextFunction } from 'express';

// Import the Service function that contains registration business logic
import { registerUser , loginUser, getUserById, updateUserById} from '../services/auth.service';


// Register Controller
export const registerController = async (req: Request, res: Response, next: NextFunction) => {
    
    // We wrap everything in a try/catch block for error handling
    try {
        // 1. Extract the data sent by the client from the HTTP request body
        const userData = req.body;
        
        // (We will call the service and send the response in the next steps)
        
        // 2. Pass the data to the Service layer to perform the actual business logic
        // The Service will hash the password, save to DB, and return the safe user data
        const newUser = await registerUser(userData);
        
               // 3. Send a successful response back to the client
        // status(201) means "Created successfully"
        // .json() formats our safe 'newUser' object as JSON and sends it
        res.status(201).json(newUser);
       } 
       
       catch (error) {

        // 4. If anything goes wrong (like duplicate email), catch the error
        // Pass the error to Express's global error handler middleware
        next(error);
    }
};


// Login Controller
export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // 1. Hand the req.body directly to our new Worker
        const result = await loginUser(req.body);

        // 2. If successful, send the Token and Safe User Data back to the client!
        // We use 200 OK because this is a standard successful request (we didn't create a new user)
        res.status(200).json(result);
    } catch (error) {
        // 3. If the Worker throws an error (like "Invalid email or password"), 
        // the Manager passes it straight to the Global Error Handler.
        next(error);
    }
};


// ==========================================
// 3. LOGOUT CONTROLLER
// ==========================================
export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
    // WHY/PURPOSE: Even though we aren't doing any complex math or database calls here,
    // we always use try/catch in our Controllers. This ensures that if the server randomly 
    // crashes here, it will safely slide down to the Global Error Handler instead of breaking the app.
    try {

        // WHAT: The backend is "stateless". It doesn't remember who is logged in.
        // HOW: True logout happens on the React Frontend when they delete the token from their browser.
        // PURPOSE: The backend just needs to send a "200 OK" to let the frontend know the request was received.
        res.status(200).json({
            message: 'Logout Successfully'
        });

    } catch (error) {
        // SECURITY CHECK: If anything goes wrong, slide the error down the pipe!
        next(error);
    }
};

// ==========================================
// 4. GET PROFILE CONTROLLER
// ==========================================
export const getProfileController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: The Bouncer (auth.middleware) already verified the token and gave us the ID!
        // HOW: We grab it directly from the envelope (req.user.userId).
        // WHY '!': The exclamation mark '!' tells TypeScript "Don't worry, I am 100% sure the Bouncer put it there."
        const userId = req.user!.userId; 

        // NEED: The Manager hands the ID to the Worker and says "Go fetch this user's data!"
        const user = await getUserById(userId);

        // PURPOSE: The Manager takes the safe data from the Worker and sends it back to the client.
        res.status(200).json({ user });
    } catch (error) {
        next(error); // SECURITY CHECK: Slide any errors (like 404 User Not Found) down the pipe!
    }
};

// ==========================================
// 5. UPDATE PROFILE CONTROLLER
// ==========================================
export const updateProfileController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // WHAT: Grab the ID from the Bouncer
        const userId = req.user!.userId;
        
        // WHAT: Grab the new data from the client (e.g., { name: "New Name" })
        const updateData = req.body; 

        // HOW: The Manager hands BOTH the ID and the new data to the Worker.
        const updatedUser = await updateUserById(userId, updateData);

        // PURPOSE: The Manager tells the client the update was successful, and gives them the fresh data!
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        next(error);
    }
};
