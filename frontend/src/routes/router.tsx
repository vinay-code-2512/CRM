import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import { LoginForm } from '../features/auth/components/LoginForm'
import { RegisterForm } from '../features/auth/components/RegisterForm'
// Import the new Bouncer
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/',
    // We wrap our dashboard (App) entirely inside the Bouncer!
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginForm />, // The login page itself must stay public
  },
  {
    path: '/register',
    element: <RegisterForm />, // The registration page must stay public
  }
])
