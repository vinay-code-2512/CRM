import { useMutation } from '@tanstack/react-query';
import api from '../../../lib/api';

// 1. The exact shape of the User object returned by the backend
export interface User {
    _id: string;
    name: string;
    email: string;
}

// 2. The exact shape of the full successful response from the backend
export interface LoginResponse {
    token: string;
    user: User;
}

// 3. The exact shape of the data the frontend form needs to send to backend
export interface LoginCredentials {
    email: string;
    password: string;
}

// 4. The raw API function that handles the network transit
// Sends the login request to the backend
// This takes the credentials and sends them to the backend via POST
// Send login data to the backend
export const loginUser = async (data: LoginCredentials): Promise<LoginResponse> => {
                        
    // Send email and password to the login API
    // Axios attaches this route to our base URL (e.g. http://localhost:3000/api/v1/auth/login)
    const response = await api.post<LoginResponse>('/auth/login', data);
    
    // Return only the actual data from the backend response
    // We only care about the actual JSON payload, which lives inside 'response.data'
    // Return the data received from the backend
    return response.data;
};

// 5. The React Query hook that our React components will actually use
// React hook that manages the login request and its state
// This wraps our raw network call in a reactive shell that automatically 
// manages loading states (isPending) and catches errors.
// Create a hook for handling login

//        useQuery
//           ↓
//      GET / fetch data
//           ↓
//       useMutation
//           ↓
//   POST / PUT / PATCH / DELETE
//           ↓
//      perform an action

export const useLogin = () => {
    return useMutation({
        
        // Run loginUser() when the login mutation is triggered
        mutationFn: loginUser,
    });
};