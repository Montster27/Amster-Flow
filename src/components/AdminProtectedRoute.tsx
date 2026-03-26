import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route component for admin-only pages.
 * Checks both authentication AND admin status before rendering.
 * Redirects to /dashboard if user is not an admin.
 */
export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  // Show loading while checking auth or admin status
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if not admin
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
