

// Keep track of whether the user is logged in, who the user is, 
// and the authentication token.



import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '../features/auth/api/login';

// 1. Define the shape of our Auth "Vault" (State)
// interface means blueprint
interface AuthState {
    user: User | null;         // Holds the logged-in user's details, or null if logged out
    token: string | null;      // Holds the JWT string, or null if logged out
    isAuthenticated: boolean;  // A simple true/false flag to easily check if someone is logged in
}


// NEW: Helper function to safely read the user profile from browser memory
const loadUserFromStorage = (): User | null => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        return null; // If something breaks, safely assume no user
    }
};


// 2. Set the starting state when the application first loads
const initialState: AuthState = {
   // NEW: Check browser memory BEFORE starting with null!
    user: loadUserFromStorage(),
    token: localStorage.getItem('token'),
    // If a token exists in memory, they are immediately authenticated
    isAuthenticated: !!localStorage.getItem('token'), 
};

// 3. Create the Slice (The Vault Manager)
const authSlice = createSlice({
    name: 'auth',                 // The label for this specific slice of data
    initialState,                 // Plug in our starting state from above
    reducers: {            // Reducers are simply the specific "actions" we can take to change the state
       
        // Action 1: What happens when they log in successfully
        setCredentials: (
            state,            // The current state of the vault
            action: PayloadAction<{ user: User; token: string }> // The new data we are sending in
        ) => {
            // Update the vault with the new data
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true; // Flip the flag to true

            // NEW: Save the token and user to browser memory so it survives refreshes
            localStorage.setItem('token', action.payload.token);
            localStorage.setItem('user', JSON.stringify(action.payload.user));
        },
        

        // Action 2: What happens when they click "Log Out"
        logout: (state) => {
            // Wipe the vault clean
            state.user = null;
            state.token = null;
            state.isAuthenticated = false; // Flip the flag to false

            // NEW: Destroy the browser memory so they are completely logged out
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
    },
});

// 4. Export the actions so our components (like LoginForm) can use them later
export const { setCredentials, logout } = authSlice.actions;

// 5. Export the reducer so we can plug it into our main store
export default authSlice.reducer;

