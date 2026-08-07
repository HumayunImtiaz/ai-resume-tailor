"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Shield, Palette, Trash2, AlertTriangle, Check, Sparkles, X } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useDashboard } from "@/lib/DashboardContext";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function SettingsPage() {
  const { refreshDashboard } = useDashboard();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  
  // Bulk Delete State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState("");
  const [deleteErrorMsg, setDeleteErrorMsg] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  const handleDeleteAllGenerated = async () => {
    setIsDeleting(true);
    setDeleteErrorMsg("");
    setDeleteSuccessMsg("");

    try {
      const res = await apiFetch("/api/resumes/versions/all", {
        method: "DELETE",
      });
      const json = await res.json();

      if (res.ok) {
        setDeleteSuccessMsg(`Successfully deleted ${json.data?.count ?? "all"} generated resume versions.`);
        setIsModalOpen(false);
        await refreshDashboard();
      } else {
        setDeleteErrorMsg(json.message || "Failed to delete generated resumes.");
      }
    } catch (err: any) {
      setDeleteErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col max-w-[900px] mx-auto py-2 overflow-y-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-fraunces text-3xl font-bold text-navy-900 mb-2">Settings</h1>
        <p className="text-navy-500 text-sm">
          Manage your account profile, preferences, and workspace security.
        </p>
      </div>

      {deleteSuccessMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-accent/10 border border-accent/20 text-accent font-semibold text-sm flex items-center justify-between animate-fadeIn">
          <span>{deleteSuccessMsg}</span>
          <button onClick={() => setDeleteSuccessMsg("")} className="text-accent hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {deleteErrorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-semibold text-sm flex items-center justify-between animate-fadeIn">
          <span>{deleteErrorMsg}</span>
          <button onClick={() => setDeleteErrorMsg("")} className="text-red-600 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900 font-fraunces">Profile Settings</h2>
              <p className="text-xs text-navy-400">Personal information associated with your account</p>
            </div>
          </div>

          {isLoadingProfile ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-10 bg-navy-100/60 rounded-xl w-full" />
              <div className="h-10 bg-navy-100/60 rounded-xl w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="text"
                    disabled
                    value={profile?.name || "User"}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-navy-50/50 text-navy-900 text-sm font-medium cursor-not-allowed opacity-90"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-900 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                  <input
                    type="email"
                    disabled
                    value={profile?.email || ""}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-navy-200 bg-navy-50/50 text-navy-900 text-sm font-medium cursor-not-allowed opacity-90"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900 font-fraunces">Account & Plan</h2>
              <p className="text-xs text-navy-400">Current subscription status and security details</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-navy-50/50 border border-navy-100 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-navy-900">Pro AI Resume Engine</span>
                <span className="px-2 py-0.5 rounded-full bg-accent text-white text-[10px] font-bold">Active</span>
              </div>
              <p className="text-xs text-navy-500">Unlimited ATS analysis, skill matching, and tailored downloads.</p>
            </div>
            {profile?.createdAt && (
              <span className="text-xs font-medium text-navy-400 shrink-0">
                Member since {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-700">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy-900 font-fraunces">Theme Preferences</h2>
              <p className="text-xs text-navy-400">Visual design system applied across the application</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border-2 border-accent bg-accent/5 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-navy-900 border-2 border-white" />
                  <div className="w-6 h-6 rounded-full bg-accent border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-900">Modern SaaS (2-Color)</p>
                  <p className="text-xs text-navy-500">Deep Navy & Sapphire Blue</p>
                </div>
              </div>
              <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50/40 border border-red-200/80 rounded-[24px] shadow-sm p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-900 font-fraunces">Danger Zone</h2>
              <p className="text-xs text-red-600/80">Irreversible actions that modify stored data</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-red-200/60 gap-4">
            <div>
              <h3 className="text-sm font-bold text-navy-900 mb-0.5">Delete All Generated Resumes</h3>
              <p className="text-xs text-navy-500 max-w-md leading-relaxed">
                Permanently deletes all AI-generated tailored resume versions from your account. Your master base resume will not be deleted.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete All Generated Resumes
            </button>
          </div>
        </div>
      </div>

      {/* Strong Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-navy-100 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-navy-900 mb-2 font-fraunces">Permanently Delete All Generated Resumes?</h3>
            <p className="text-navy-500 text-sm mb-6 leading-relaxed">
              This will permanently erase all AI-tailored resume versions, keyword match scores, and history for your account. <span className="font-bold text-red-600">This action cannot be undone.</span>
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-navy-200 text-navy-700 text-sm font-semibold hover:bg-navy-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllGenerated}
                disabled={isDeleting}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete All Generated Resumes"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
