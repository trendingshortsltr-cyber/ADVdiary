'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CaseFile {
  id: string;
  fileName: string;
  fileType: string;
  fileData: string; // Base64 encoded
  uploadedAt: string;
}

export interface HearingDate {
  id: string;
  date: string;
  time?: string;
  notes?: string;
}

export interface Case {
  id: string;
  clientName: string;
  caseNumber: string;
  courtName: string;
  hearingDates: HearingDate[];
  status: 'Active' | 'Closed';
  notes?: string;
  files?: CaseFile[];
  createdAt: string;
}

const STORAGE_KEY = 'advocate_cases';
const USERS_STORAGE_KEY = 'advocate_users';

export interface User {
  id: string;
  email: string;
  password: string;
}

export const useCaseManager = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      loadCases(JSON.parse(storedUser).id);
    }
    setIsLoading(false);
  }, []);

  const loadCases = useCallback((userId: string) => {
    const userCasesKey = `${STORAGE_KEY}_${userId}`;
    const storedCases = localStorage.getItem(userCasesKey);
    if (storedCases) {
      setCases(JSON.parse(storedCases));
    } else {
      setCases([]);
    }
  }, []);

  const saveCases = useCallback((newCases: Case[]) => {
    if (currentUser) {
      const userCasesKey = `${STORAGE_KEY}_${currentUser.id}`;
      localStorage.setItem(userCasesKey, JSON.stringify(newCases));
      setCases(newCases);
    }
  }, [currentUser]);

  const addCase = useCallback((caseData: Omit<Case, 'id' | 'createdAt'>) => {
    const newCase: Case = {
      ...caseData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedCases = [...cases, newCase];
    saveCases(updatedCases);
    return newCase;
  }, [cases, saveCases]);

  const updateCase = useCallback((id: string, updates: Partial<Case>) => {
    const updatedCases = cases.map(c => c.id === id ? { ...c, ...updates } : c);
    saveCases(updatedCases);
  }, [cases, saveCases]);

  const deleteCase = useCallback((id: string) => {
    const updatedCases = cases.filter(c => c.id !== id);
    saveCases(updatedCases);
  }, [cases, saveCases]);

  const addHearingDate = useCallback((caseId: string, hearingDate: Omit<HearingDate, 'id'>) => {
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          hearingDates: [...c.hearingDates, { ...hearingDate, id: Date.now().toString() }],
        };
      }
      return c;
    });
    saveCases(updatedCases);
  }, [cases, saveCases]);

  const updateHearingDate = useCallback((caseId: string, hearingDateId: string, updates: Partial<HearingDate>) => {
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          hearingDates: c.hearingDates.map(h => h.id === hearingDateId ? { ...h, ...updates } : h),
        };
      }
      return c;
    });
    saveCases(updatedCases);
  }, [cases, saveCases]);

  const deleteHearingDate = useCallback((caseId: string, hearingDateId: string) => {
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          hearingDates: c.hearingDates.filter(h => h.id !== hearingDateId),
        };
      }
      return c;
    });
    saveCases(updatedCases);
  }, [cases, saveCases]);

  const getNextHearingDate = (c: Case): HearingDate | undefined => {
    const now = new Date();
    const futureHearings = c.hearingDates
      .filter(h => new Date(h.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return futureHearings[0];
  };

  const getTodaysHearings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return cases.filter(c => c.status === 'Active' && c.hearingDates.some(h => h.date === today));
  }, [cases]);

  const getUpcomingWeek = useCallback(() => {
    const today = new Date();
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const todayStr = today.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    return cases
      .filter(c => c.status === 'Active')
      .flatMap(c => c.hearingDates
        .filter(h => h.date >= todayStr && h.date <= weekEndStr)
        .map(h => ({ ...h, caseId: c.id, clientName: c.clientName, caseNumber: c.caseNumber }))
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [cases]);

  const searchCases = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return cases.filter(c =>
      c.clientName.toLowerCase().includes(lowerQuery) ||
      c.caseNumber.toLowerCase().includes(lowerQuery) ||
      c.courtName.toLowerCase().includes(lowerQuery)
    );
  }, [cases]);

  const getSortedCases = useCallback((filtered?: Case[]) => {
    const casesToSort = filtered || cases;
    return casesToSort.sort((a, b) => {
      const nextA = getNextHearingDate(a);
      const nextB = getNextHearingDate(b);
      if (!nextA && !nextB) return 0;
      if (!nextA) return 1;
      if (!nextB) return -1;
      return new Date(nextA.date).getTime() - new Date(nextB.date).getTime();
    });
  }, [cases]);

  const addCaseFile = useCallback((caseId: string, file: CaseFile) => {
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          files: [...(c.files || []), file],
        };
      }
      return c;
    });
    saveCases(updatedCases);
  }, [cases, saveCases]);

  const deleteCaseFile = useCallback((caseId: string, fileId: string) => {
    const updatedCases = cases.map(c => {
      if (c.id === caseId) {
        return {
          ...c,
          files: (c.files || []).filter(f => f.id !== fileId),
        };
      }
      return c;
    });
    saveCases(updatedCases);
  }, [cases, saveCases]);

  return {
    currentUser,
    cases,
    isLoading,
    addCase,
    updateCase,
    deleteCase,
    addHearingDate,
    updateHearingDate,
    deleteHearingDate,
    addCaseFile,
    deleteCaseFile,
    getTodaysHearings,
    getUpcomingWeek,
    searchCases,
    getSortedCases,
    getNextHearingDate,
    setCurrentUser,
    loadCases,
  };
};
