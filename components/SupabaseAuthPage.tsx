'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface SupabaseAuthPageProps {
  onAuthSuccess: () => void;
}

export function SupabaseAuthPage({ onAuthSuccess }: SupabaseAuthPageProps) {
  const { signIn, signUp, error } = useSupabaseAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setLocalError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        const result = await signUp(email, password);
        if (!result.success) {
          setLocalError(result.error || 'Sign up failed');
          setIsLoading(false);
          return;
        }
      } else {
        const result = await signIn(email, password);
        if (!result.success) {
          setLocalError(result.error || 'Sign in failed');
          setIsLoading(false);
          return;
        }
      }

      // Brief delay to ensure auth state is updated
      setTimeout(() => {
        onAuthSuccess();
      }, 500);
    } catch (err: any) {
      setLocalError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: 'url(/images/advocate-header.jpg)',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 w-full px-4">
        <Card className="w-full max-w-md mx-auto p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">CaseTrack</h1>
            <p className="text-muted-foreground">
              {isSignUp ? 'Create Your Account' : 'Sign In to Your Account'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            )}

            {(localError || error) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                {localError || error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {isSignUp
                ? 'Already have an account?'
                : "Don't have an account?"}
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setLocalError(null);
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              disabled={isLoading}
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
