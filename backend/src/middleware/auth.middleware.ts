import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

// ==========================================
// SECURITY BOUNCER (AUTH MIDDLEWARE)
// ==========================================

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // WHY/PURPOSE: This acts as a Bouncer at the door of a club. If a route is protected, 
    // the user MUST present a valid JWT ID card to pass through.
    
    try {
        // WHAT: The token is usually sent in a header that looks like: "Authorization: Bearer eyJhbG..."
        // HOW: We grab that header from the incoming request envelope.
        const authHeader = req.headers.authorization;

        // SECURITY CHECK 1: Did they even bring an ID card?
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // If no token, or it's formatted wrong, the Bouncer kicks them out immediately!
            // We use 'return' so the function stops running completely.
            res.status(401).json({ message: 'Unauthorized. No token provided.' });
            return;
        }

        // HOW: We split the string "Bearer eyJhbG..." by the space, and take the second part [1] (the actual token).
        const token = authHeader.split(' ')[1];

        // SECURITY CHECK 2: Is the ID card real or fake?
        // HOW: We use the exact same JWT_SECRET we used to create the token to decrypt it.
        // If it is expired or tampered with, jwt.verify will THROW an error automatically!
        const decoded = jwt.verify(token, ENV.JWT_SECRET as string) as { userId: string };

        // WHAT: If decryption succeeds, we extract the userId from the payload.
        // HOW: We stick it into the `req.user` object we just created in express.d.ts!
        // PURPOSE: Now, the Manager (Controller) can easily see who made this request!
        req.user = {
            userId: decoded.userId
        };

        // NEED: The Bouncer opens the door. `next()` tells Express to pass the request to the Manager (Controller).
        next();

    } catch (error) {
        // SECURITY CHECK 3: If jwt.verify fails (expired or fake token), it lands here.
        // The Bouncer kicks them out with a 401 Unauthorized!
        res.status(401).json({ message: 'Unauthorized. Invalid or expired token.' });
    }
};

