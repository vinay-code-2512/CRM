// Type your ProtectedRoute code here
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../../store/store';

// We define that this component expects to wrap around other components (children)
interface ProtectedRouteProps {
    children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // 1. Look inside the Redux Vault to see if the user is authenticated
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

    // 2. If they are NOT logged in, kick them to the login page immediately.
    // (We use `replace` so they can't click the "Back" button to bypass this)
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. If they ARE logged in, let them see the page they asked for!
    return <>{children}</>;
};
