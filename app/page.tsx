'use client';

import { useEffect, useState } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { SupabaseAuthPage } from '@/components/SupabaseAuthPage';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseCases } from '@/hooks/useSupabaseCases';

export default function Page() {
  const { user, isLoading: authLoading, signOut } = useSupabaseAuth();
  const { cases, isLoading: casesLoading, addCase, updateCase, deleteCase, addHearingDate, updateHearingDate, deleteHearingDate } = useSupabaseCases(user?.id || null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setIsInitialized(true);
    }
  }, [authLoading]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">CaseTrack</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <SupabaseAuthPage
        onAuthSuccess={() => {
          // Auth state will update automatically via useSupabaseAuth
          setIsInitialized(false);
          setTimeout(() => setIsInitialized(true), 500);
        }}
      />
    );
  }

  return (
    <Dashboard
      onLogout={signOut}
      userEmail={user.email}
      cases={cases}
      addCase={addCase}
      updateCase={updateCase}
      deleteCase={deleteCase}
      addHearingDate={addHearingDate}
      updateHearingDate={updateHearingDate}
      deleteHearingDate={deleteHearingDate}
      isLoading={casesLoading}
    />
  );
}
