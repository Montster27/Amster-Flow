import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { captureException } from '../lib/sentry';
import { logAuthEvent } from '../lib/auditLog';

// Parse error parameters from URL (both hash and search params)
function parseUrlErrors(): { error: string | null; errorDescription: string | null } {
  // Check URL hash first (Supabase typically uses hash for auth callbacks)
  const hash = window.location.hash.substring(1); // Remove leading #
  const hashParams = new URLSearchParams(hash);

  // Also check query params as fallback
  const searchParams = new URLSearchParams(window.location.search);

  const error = hashParams.get('error') || searchParams.get('error');
  const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');

  return { error, errorDescription };
}

// Map Supabase error codes to user-friendly messages
function getErrorMessage(error: string | null, errorDescription: string | null): string {
  if (errorDescription) {
    // Decode URL-encoded description and capitalize first letter
    const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
    return decoded.charAt(0).toUpperCase() + decoded.slice(1);
  }

  // Map common error codes
  switch (error) {
    case 'access_denied':
      return 'Access denied. The reset link may have expired or already been used.';
    case 'unauthorized_client':
      return 'This reset link is not authorized.';
    case 'invalid_request':
      return 'Invalid request. Please try requesting a new reset link.';
    case 'expired_token':
      return 'This reset link has expired. Please request a new one.';
    default:
      return 'This password reset link is invalid or has expired.';
  }
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validSession, setValidSession] = useState<boolean | null>(null);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // First, check for errors in URL parameters (immediate check)
    const { error: urlError, errorDescription } = parseUrlErrors();

    if (urlError) {
      // Supabase has already indicated an error - show it immediately
      hasProcessedRef.current = true;
      setUrlErrorMessage(getErrorMessage(urlError, errorDescription));
      setValidSession(false);
      return; // Don't set up listeners if we already know it failed
    }

    // Listen for auth state changes, specifically PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Prevent processing multiple times
      if (hasProcessedRef.current) return;

      if (event === 'PASSWORD_RECOVERY') {
        // Supabase has processed the recovery token from URL
        hasProcessedRef.current = true;
        setValidSession(true);
      } else if (event === 'SIGNED_IN' && session) {
        // User might already have a valid session (token was processed before listener attached)
        hasProcessedRef.current = true;
        setValidSession(true);
      }
    });

    // Also check if there's already a session (in case token was processed very quickly)
    const checkExistingSession = async () => {
      // Small delay to allow Supabase to process URL hash
      await new Promise(resolve => setTimeout(resolve, 100));

      if (hasProcessedRef.current) return; // Already handled by listener

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        hasProcessedRef.current = true;
        setValidSession(true);
      }
    };

    checkExistingSession();

    // Set a timeout to show invalid message if no session is established
    // This is a fallback for cases where no URL error exists but token processing fails silently
    const timeout = setTimeout(() => {
      if (!hasProcessedRef.current) {
        setValidSession(false);
      }
    }, 3000); // Wait 3 seconds before showing invalid

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      // Log the password reset
      if (data.user) {
        await logAuthEvent('auth.password_reset', data.user.id, data.user.email || 'unknown');
      }

      // Success - redirect to login
      navigate('/login', {
        state: { message: 'Password reset successfully! Please log in with your new password.' },
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to reset password');
      captureException(error, {
        extra: { context: 'ResetPasswordPage' },
      });
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (validSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Verifying your reset link...</div>
        </div>
      </div>
    );
  }

  if (validSession === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Invalid or Expired Link
            </h2>
          </div>
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-6">
            <p className="text-center text-red-900 mb-4">
              {urlErrorMessage || 'This password reset link is invalid or has expired.'}
            </p>
            <p className="text-sm text-red-800 text-center">
              Password reset links expire after 1 hour. Please request a new one.
            </p>
          </div>
          <div className="text-center space-y-2">
            <div>
              <button
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Request New Reset Link
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate('/login')}
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Set New Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 border-2 border-red-400 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Must be at least 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Re-enter your new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
