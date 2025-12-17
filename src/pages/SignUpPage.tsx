import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { captureException } from '../lib/sentry';
import { logAuthEvent } from '../lib/auditLog';

const AFFILIATION_OPTIONS = [
  'Auxilium',
  'MIT Sandbox',
  'Explorer',
  'Masa',
  'Brown University',
  'Other',
] as const;

export function SignUpPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [customAffiliation, setCustomAffiliation] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is fully mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check terms acceptance
      if (!acceptedTerms) {
        setError('You must accept the Terms of Service and Privacy Policy to continue');
        setLoading(false);
        return;
      }

      // Determine final affiliation value
      const finalAffiliation = affiliation === 'Other' ? customAffiliation : affiliation;

      if (!finalAffiliation) {
        setError('Please select or enter an affiliation');
        setLoading(false);
        return;
      }

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            affiliation: finalAffiliation,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error('Sign up failed - no user returned');
      }

      // Profile is auto-created by database trigger (handle_new_user)
      // with affiliation from user metadata

      // Log successful signup to audit trail
      await logAuthEvent('auth.signup', authData.user.id, email, {
        success: true,
        metadata: { affiliation: finalAffiliation },
      });

      // Email confirmation is always required for security
      setSuccess(`Account created successfully! Please check your email (${email}) and click the confirmation link to activate your account. Check your spam folder if you don't see it within a few minutes.`);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Error signing up');
      captureException(error, {
        extra: {
          email,
          affiliation: affiliation === 'Other' ? customAffiliation : affiliation,
          context: 'SignUpPage sign up'
        },
      });
      setError(err instanceof Error ? err.message : 'An error occurred during sign up');
    } finally {
      setLoading(false);
    }
  };

  // Ensure component is mounted before rendering form to prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">PivotKit</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
            </div>

            {/* Affiliation */}
            <div>
              <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700 mb-1">
                Affiliation <span className="text-red-500">*</span>
              </label>
              <select
                id="affiliation"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                required
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  !affiliation
                    ? 'border-red-300 text-gray-400 bg-red-50 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 text-gray-900 focus:ring-blue-500'
                }`}
              >
                <option value="" disabled>Select your affiliation</option>
                {AFFILIATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {!affiliation && (
                <p className="text-xs text-red-600 mt-1">Required field - please select your affiliation</p>
              )}
            </div>

            {/* Custom Affiliation Input (shown when "Other" is selected) */}
            {affiliation === 'Other' && (
              <div>
                <label htmlFor="customAffiliation" className="block text-sm font-medium text-gray-700 mb-1">
                  Please specify
                </label>
                <input
                  id="customAffiliation"
                  type="text"
                  value={customAffiliation}
                  onChange={(e) => setCustomAffiliation(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your affiliation"
                />
              </div>
            )}

            {/* Terms of Service Acceptance */}
            <div className="flex items-start">
              <input
                id="acceptTerms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-700">
                I accept the{' '}
                <Link
                  to="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  Terms of Service and Privacy Policy
                </Link>
                {' '}<span className="text-red-500">*</span>
              </label>
            </div>

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={
                loading ||
                !email ||
                !password ||
                !affiliation ||
                (affiliation === 'Other' && !customAffiliation) ||
                !acceptedTerms
              }
              className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>By signing up, you agree to our terms and privacy policy.</p>
        </div>
      </div>
    </div>
  );
}
