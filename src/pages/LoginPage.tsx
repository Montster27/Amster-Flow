import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as any)?.message;
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendMessage, setResendMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setResendMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.toLowerCase().trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      setResendMessage({
        type: 'success',
        text: `Confirmation email sent to ${resendEmail}. Please check your inbox and spam folder.`,
      });
      setResendEmail('');
      setTimeout(() => {
        setShowResendForm(false);
        setResendMessage(null);
      }, 5000);
    } catch (error) {
      setResendMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to resend confirmation email. Please try again.',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PivotKit</h1>
          <p className="text-gray-600">Sign in to start building your Lean Canvas</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-lg">
              <p className="text-sm text-green-900">{successMessage}</p>
            </div>
          )}

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
              style: {
                anchor: {
                  fontWeight: 'bold',
                  fontSize: '1.125rem', // 2 points bigger (from default ~14px to ~18px)
                },
              },
            }}
            providers={[]}
            onlyThirdPartyProviders={false}
            view="sign_in"
            redirectTo={`${window.location.origin}/dashboard`}
          />

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Resend Confirmation Email */}
          <div className="mt-4 text-center">
            {!showResendForm ? (
              <button
                onClick={() => setShowResendForm(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Email not confirmed? Resend confirmation
              </button>
            ) : (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Resend Confirmation Email</h3>
                <form onSubmit={handleResendConfirmation}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {resendMessage && (
                    <div className={`mb-3 p-2 rounded text-sm ${
                      resendMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {resendMessage.text}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isResending || !resendEmail.trim()}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResending ? 'Sending...' : 'Send Confirmation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResendForm(false);
                        setResendMessage(null);
                        setResendEmail('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sign Up Link */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-700 font-bold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>By signing in, you agree to our terms and privacy policy.</p>
        </div>
      </div>
    </div>
  );
}
