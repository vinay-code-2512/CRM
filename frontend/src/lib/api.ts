import axios from 'axios'

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

export default api