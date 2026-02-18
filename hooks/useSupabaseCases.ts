'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Case, HearingDate, CaseFile } from './useCaseManager';
import { uploadFile, deleteFile } from '@/lib/supabase/storage';

const supabase = createClient();

export function useSupabaseCases(userId: string | null) {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all cases for the user
  const loadCases = useCallback(async () => {
    if (!userId) {
      setCases([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      const { data: hearingsData, error: hearingsError } = await supabase
        .from('hearing_dates')
        .select('*')
        .in('case_id', casesData?.map(c => c.id) || []);

      if (hearingsError) throw hearingsError;

      const casesWithHearings: Case[] = (casesData || []).map(c => ({
        id: c.id,
        clientName: c.client_name,
        caseNumber: c.case_number,
        courtName: c.court_name,
        status: c.status,
        notes: c.notes,
        createdAt: c.created_at,
        hearingDates: (hearingsData || [])
          .filter(h => h.case_id === c.id)
          .map(h => ({
            id: h.id,
            date: h.date,
            time: h.time,
            notes: h.notes,
          })),
        files: c.files || [],
      }));

      setCases(casesWithHearings);
    } catch (err: any) {
      console.error('Error loading cases:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Add case
  const addCase = useCallback(
    async (caseData: Omit<Case, 'id' | 'createdAt'>) => {
      if (!userId) return;

      try {
        setError(null);

        let uploadedFiles: CaseFile[] = [];

        if (caseData.files && caseData.files.length > 0) {
          uploadedFiles = caseData.files;
        }

        const { data, error: insertError } = await supabase
          .from('cases')
          .insert({
            user_id: userId,
            client_name: caseData.clientName,
            case_number: caseData.caseNumber,
            court_name: caseData.courtName,
            status: caseData.status,
            notes: caseData.notes || null,
            created_at: new Date().toISOString(),
            files: uploadedFiles,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Add hearing dates
        if (caseData.hearingDates && caseData.hearingDates.length > 0) {
          const hearingInserts = caseData.hearingDates.map(h => ({
            case_id: data.id,
            date: h.date,
            time: h.time || null,
            notes: h.notes || null,
          }));

          const { error: hearingError } = await supabase
            .from('hearing_dates')
            .insert(hearingInserts);

          if (hearingError) throw hearingError;
        }

        await loadCases();
      } catch (err: any) {
        console.error('Error adding case:', err);
        setError(err.message);
      }
    },
    [userId, loadCases]
  );

  // Update case
  const updateCase = useCallback(
    async (caseId: string, updates: Partial<Case>) => {
      if (!userId) return;

      try {
        setError(null);

        const updateData: any = {};
        if (updates.clientName) updateData.client_name = updates.clientName;
        if (updates.caseNumber) updateData.case_number = updates.caseNumber;
        if (updates.courtName) updateData.court_name = updates.courtName;
        if (updates.status) updateData.status = updates.status;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.files !== undefined) updateData.files = updates.files;

        const { error: updateError } = await supabase
          .from('cases')
          .update(updateData)
          .eq('id', caseId)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        await loadCases();
      } catch (err: any) {
        console.error('Error updating case:', err);
        setError(err.message);
      }
    },
    [userId, loadCases]
  );

  // Delete case
  const deleteCase = useCallback(
    async (caseId: string) => {
      if (!userId) return;

      try {
        setError(null);

        // Delete hearing dates first (foreign key constraint)
        const { error: hearingError } = await supabase
          .from('hearing_dates')
          .delete()
          .eq('case_id', caseId);

        if (hearingError) throw hearingError;

        // Delete case
        const { error: caseError } = await supabase
          .from('cases')
          .delete()
          .eq('id', caseId)
          .eq('user_id', userId);

        if (caseError) throw caseError;

        await loadCases();
      } catch (err: any) {
        console.error('Error deleting case:', err);
        setError(err.message);
      }
    },
    [userId, loadCases]
  );

  // Add hearing date
  const addHearingDate = useCallback(
    async (caseId: string, hearingData: Omit<HearingDate, 'id'>) => {
      if (!userId) return;

      try {
        setError(null);

        const { error: insertError } = await supabase
          .from('hearing_dates')
          .insert({
            case_id: caseId,
            date: hearingData.date,
            time: hearingData.time || null,
            notes: hearingData.notes || null,
          });

        if (insertError) throw insertError;

        await loadCases();
      } catch (err: any) {
        console.error('Error adding hearing date:', err);
        setError(err.message);
      }
    },
    [userId, loadCases]
  );

  // Update hearing date
  const updateHearingDate = useCallback(
    async (caseId: string, hearingId: string, updates: Partial<HearingDate>) => {
      if (!userId) return;

      try {
        setError(null);

        const updateData: any = {};
        if (updates.date) updateData.date = updates.date;
        if (updates.time !== undefined) updateData.time = updates.time;
        if (updates.notes !== undefined) updateData.notes = updates.notes;

        const { error: updateError } = await supabase
          .from('hearing_dates')
          .update(updateData)
          .eq('id', hearingId)
          .eq('case_id', caseId);

        if (updateError) throw updateError;

        await loadCases();
      } catch (err: any) {
        console.error('Error updating hearing date:', err);
        setError(err.message);
      }
    },
    [userId, loadCases]
  );

  // Delete hearing date
  const deleteHearingDate = useCallback(
    async (caseId: string, hearingId: string) => {
      if (!userId) return;

      try {
        setError(null);

        const { error: deleteError } = await supabase
          .from('hearing_dates')
          .delete()
          .eq('id', hearingId)
          .eq('case_id', caseId);

        if (deleteError) throw deleteError;

        await loadCases();
      } catch (err: any) {
        console.error('Error deleting hearing date:', err);
        setError(err.message);
      }
    },
    [userId, loadCases]
  );

  // Add file to case
  const addCaseFile = useCallback(
    async (caseId: string, file: CaseFile) => {
      if (!userId) return;

      const caseToUpdate = cases.find(c => c.id === caseId);
      if (!caseToUpdate) return;

      const currentFiles = caseToUpdate.files || [];
      const newFiles = [...currentFiles, file];

      await updateCase(caseId, { files: newFiles });
    },
    [userId, cases, updateCase]
  );

  // Delete file from case
  const deleteCaseFile = useCallback(
    async (caseId: string, fileId: string) => {
      if (!userId) return;

      const caseToUpdate = cases.find(c => c.id === caseId);
      if (!caseToUpdate) return;

      // Attempt to delete from storage if it's a supabase URL
      // We are just removing metadata for now as we don't track full path perfectly here without extra logic

      const newFiles = (caseToUpdate.files || []).filter(f => f.id !== fileId);
      await updateCase(caseId, { files: newFiles });
    },
    [userId, cases, updateCase]
  );

  return {
    cases,
    isLoading,
    error,
    loadCases,
    addCase,
    updateCase,
    deleteCase,
    addHearingDate,
    updateHearingDate,
    deleteHearingDate,
    addCaseFile,
    deleteCaseFile
  };
}
