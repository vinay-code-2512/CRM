import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { setCredentials } from '../../../store/authSlice';
import { useLogin } from '../api/login';
// 1. Import Axios so we can read the backend's error format
import axios from 'axios'; 

export const LoginForm: React.FC = () => {
    // 1. Component State 
    // email → current email value 
    // setEmail → changes the email value 
    // '' → initial value is empty

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

     // 2. Create a new state to hold our error message text
    const [errorMessage, setErrorMessage] = useState('');

     // 2. Initialize Redux dispatch and Router navigation
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // 2. React Query Hook- " Get the login function and the request loading state "
    const { mutate: login, isPending } = useLogin();

    // 3. Submit Handler- " // Handle form submission " , 'e' is event
    // A handler is a function that runs when a specific event happens.
    // User submits form
    //       ↓
    // handleSubmit()
    //       ↓
    // Your code runs

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        // code to run when the event happens

        // Prevent the page from refreshing ,
        // e.preventDefault() → stops the browser's default form submission/reload
        e.preventDefault();
        // code to run when form is submitted

         // Clear any old error messages when they try to submit again
        setErrorMessage('');

        // Trigger the mutation, sending the credentials to the backend
        // Send the email and password to the login API
        // login({ email, password }) is the point where you trigger the actual login process.
        // login(...)
        //   ↓
        // useMutation
        //    ↓
        // calls loginUser(...)

        // Trigger the mutation, sending the credentials to the backend
        login({ email, password },
            {
                // 3. What to do when the backend says "200 OK"
                onSuccess: (data) =>{

                    // Send the token and user to our Redux Vault
                    dispatch(setCredentials({user:data.user, token: data.token}))

                    // Teleport the user to the dashboard
                    navigate('/')
                },
                //   4. What to do if the password is wrong
                onError: (error) => {

                    // 3. Look inside the Axios error to find the message our backend sent
                    if (axios.isAxiosError(error) && error.response) {
                         // error.response.data.message usually contains "Invalid email or password"
                         
                        setErrorMessage(error.response.data.message || 'Login failed.');
                    } else {
                        setErrorMessage('An unexpected error occurred. Please try again.');
                    }
                }
            }
        )
    };

return (
        // Full screen dark gradient background
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 font-sans">
            
            // Glassmorphism Card
            <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
                
                {/* Decorative glowing orb in the background */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
                        <p className="text-slate-400 text-sm">Sign in to your SyncForge account</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Error Message Box */}
                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center shadow-lg animate-pulse">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {errorMessage}
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-slate-500"
                                placeholder="you@company.com"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-slate-500"
                                placeholder="••••••••"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isPending}
                            className={`w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 transform hover:-translate-y-0.5 shadow-lg shadow-indigo-500/30 flex justify-center items-center ${isPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                'Log In'
                            )}
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-400">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
