'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export interface AuthUser {
  id: string;
  email: string;
}

export function useSupabaseAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check current session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
          });
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Session check error:', err);
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setUser({
          id: data.user?.id!,
          email: data.user?.email!,
        });
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || 'Sign up failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        setError(null);
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setUser({
          id: data.user?.id!,
          email: data.user?.email!,
        });
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || 'Sign in failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    try {
      setError(null);
      await supabase.auth.signOut();
      setUser(null);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    signUp,
    signIn,
    signOut,
  };
}
