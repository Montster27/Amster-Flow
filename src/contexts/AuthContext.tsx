import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { setUser as setSentryUser, captureException, addBreadcrumb } from '../lib/sentry';
import { logAuthEvent } from '../lib/auditLog';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Use ref to track user for logout logging (avoids stale closure)
  const userRef = useRef<User | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
      // Set user in Sentry for error tracking context
      setSentryUser(
        session?.user ? { id: session.user.id, email: session.user.email } : null
      );
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Capture previous user before updating state (for logout logging)
      const previousUser = userRef.current;

      setSession(session);
      setUser(session?.user ?? null);
      userRef.current = session?.user ?? null;
      // Update Sentry user context on auth state changes
      setSentryUser(
        session?.user ? { id: session.user.id, email: session.user.email } : null
      );
      setLoading(false);

      // Log auth events to audit trail
      if (event === 'SIGNED_IN' && session?.user) {
        logAuthEvent('auth.login', session.user.id, session.user.email || 'unknown');
      } else if (event === 'SIGNED_OUT') {
        // Use previousUser from ref to avoid stale closure
        if (previousUser) {
          logAuthEvent('auth.logout', previousUser.id, previousUser.email || 'unknown');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (!error && data.user) {
      // Create profile entry
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName || null,
      });

      // Log profile creation errors but don't fail signup
      // (profile may already exist from previous signup attempt or trigger)
      if (profileError && profileError.code !== '23505') {
        captureException(new Error('Error creating profile'), {
          extra: { profileError, userId: data.user.id, email: data.user.email },
        });
      }
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      // Try to sign out from server
      const { error } = await supabase.auth.signOut();

      if (error) {
        // If server sign out fails (403, network error, etc.),
        // still clear local session
        addBreadcrumb('auth', 'Server sign out failed, clearing local session', { error: error.message });

        // Force local sign out by clearing storage
        await supabase.auth.signOut({ scope: 'local' });
      }
    } catch (err) {
      // If anything fails, force local sign out
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addBreadcrumb('auth', 'Sign out error', { error: errorMessage });
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch (localError) {
        const localErrorMessage = localError instanceof Error ? localError.message : 'Unknown error';
        addBreadcrumb('auth', 'Local sign out also failed', { error: localErrorMessage });
      }
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
