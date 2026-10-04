import { useMutation } from '@tanstack/react-query';
import api from '../../../lib/api';

// 1. The exact shape of the response from the backend when registration succeeds
// According to our API-Specification.md, it returns a message and a userId
// Replace lines 6-9 with:
export interface RegisterResponse {
    _id: string;
    name: string;
    email: string;
}


// 2. The exact shape of the data the frontend form needs to send to the backend
export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
}

// 3. The raw API function that handles the network transit
export const registerUser = async (data: RegisterCredentials): Promise<RegisterResponse> => {
    
    // Axios attaches this route to our base URL (e.g. http://localhost:3000/api/v1/auth/register)
    const response = await api.post<RegisterResponse>('/auth/register', data);
    
    // We only care about the actual JSON payload, which lives inside 'response.data'
    return response.data;
};

// 4. The React Query hook that our React components will actually use
// This wraps our raw network call in a reactive shell that automatically 
// manages loading states (isPending) and catches errors.
export const useRegister = () => {
    return useMutation({
        mutationFn: registerUser,
    });
};
