// ==========================================
// TYPESCRIPT EXPRESS EXTENSION
// ==========================================

// WHY/PURPOSE: We need to modify the default Express 'Request' object.
// HOW: We use a feature called "Declaration Merging". We declare the 'express' module again, 
// and TypeScript will magically merge our new properties with the original Express properties!
declare namespace Express {
    
    // WHAT: We are targeting the 'Request' interface inside Express.
    export interface Request {
        
        // NEED: When the Bouncer (auth.middleware) verifies a JWT, it needs a safe place to put the user's ID.
        // It will put it inside this 'user' object, so the Manager (Controller) can easily grab it later using `req.user.userId`.
        user?: {
            userId: string;
        };
    }
}
