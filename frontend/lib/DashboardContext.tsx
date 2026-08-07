"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";

export interface Resume {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

export interface CoverLetter {
  id: string;
  originalFilename: string;
  uploadedAt: string;
}

export interface TailoredVersion {
  id: string;
  matchScore: number;
  createdAt: string;
  jobDescription: {
    id: string;
    title: string;
    company: string | null;
  };
}

interface DashboardContextType {
  resumes: Resume[];
  activeResume: Resume | null;
  coverLetters: CoverLetter[];
  activeCoverLetter: CoverLetter | null;
  versions: TailoredVersion[];
  isLoading: boolean;
  isCheckingAuth: boolean;
  refreshDashboard: () => Promise<void>;
  removeVersion: (versionId: string) => void;
  handleLogout: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [versions, setVersions] = useState<TailoredVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await apiFetch("/api/resumes");
      const json = await res.json();
      const resumeList: Resume[] = json.data || [];
      
      // Sort most recent first
      const sortedResumes = [...resumeList].sort(
        (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );
      setResumes(sortedResumes);

      const clRes = await apiFetch("/api/cover-letters");
      if (clRes.ok) {
        const clJson = await clRes.json();
        const clList: CoverLetter[] = clJson.data || [];
        setCoverLetters([...clList].sort(
          (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        ));
      }

      if (sortedResumes.length > 0) {
        const mostRecent = sortedResumes[0];
        const vRes = await apiFetch(`/api/resumes/${mostRecent.id}/versions`);
        const vJson = await vRes.json();
        setVersions(vJson.data || []);
      } else {
        setVersions([]);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          setIsCheckingAuth(false);
          fetchDashboardData();
        } else {
          router.replace("/login");
        }
      } catch (err) {
        router.replace("/login");
      }
    };
    checkAuth();
  }, [router, fetchDashboardData]);

  const removeVersion = (versionId: string) => {
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    }
    router.replace("/login");
  };

  const activeResume = resumes.length > 0 ? resumes[0] : null;
  const activeCoverLetter = coverLetters.length > 0 ? coverLetters[0] : null;

  return (
    <DashboardContext.Provider
      value={{
        resumes,
        activeResume,
        coverLetters,
        activeCoverLetter,
        versions,
        isLoading,
        isCheckingAuth,
        refreshDashboard: fetchDashboardData,
        removeVersion,
        handleLogout,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
