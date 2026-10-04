import axios from 'axios'
import { store } from '../store/store';
import { logout } from '../store/authSlice';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// NEW: Add an interceptor that runs before EVERY request leaves the frontend
api.interceptors.request.use((config) => {
    // 1. Grab the token we saved during login from browser memory
    const token = localStorage.getItem('token');
    
    // 2. If we have a token, stick it on the Authorization header like a VIP pass
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// NEW: Add a response interceptor to globally catch 401 Unauthorized errors
api.interceptors.response.use(
  (response) => {
    // If the request succeeds, just pass the response through
    return response;
  },
  (error) => {
    // If the backend rejects the token (expired or invalid)...
    if (error.response && error.response.status === 401) {
      
      // 1. Dispatch our existing Redux logout action.
      // This instantly wipes localStorage AND flips isAuthenticated to false.
      store.dispatch(logout());
      
      // 2. Because the state just updated, React Router's <ProtectedRoute> 
      // will instantly and smoothly redirect the user to /login!
    }
    
    return Promise.reject(error);
  }
);

export default api