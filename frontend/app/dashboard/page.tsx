"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResumeUploader from "@/components/ResumeUploader";
import ResumeList from "@/components/ResumeList";
import { Sparkles, LogOut, Hexagon, Waves } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  const handleUploadSuccess = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#FDFDFE] flex flex-col justify-center items-center">
         <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full border-4 border-amber/10" />
            <div className="absolute inset-0 rounded-full border-4 border-amber border-t-transparent animate-[spin_1s_ease-in-out_infinite]" />
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-ink-navy font-sans antialiased relative overflow-hidden selection:bg-amber/20">
      
      {/* Stunning Soft Pastel Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-amber/20 via-rose-300/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-tl from-sky-300/20 via-indigo-300/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[20%] w-[30vw] h-[30vw] rounded-full bg-gradient-to-tr from-orange-200/20 to-transparent blur-[80px] pointer-events-none" />

      {/* Very faint grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none mix-blend-multiply" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto w-full px-5 md:px-8 py-8">
        
        {/* Playful & Premium Header */}
        <header className="flex justify-between items-center bg-white/60 backdrop-blur-xl border border-white shadow-[0_4px_40px_rgb(0,0,0,0.02)] rounded-[24px] p-4 md:px-6 mb-10 transition-all">
           <div className="flex items-center gap-3">
             <div className="relative flex items-center justify-center w-11 h-11 rounded-[14px] bg-gradient-to-br from-amber to-orange-400 p-0.5 shadow-lg shadow-amber/20">
                <div className="relative flex items-center justify-center w-full h-full bg-white rounded-[12px]">
                   <Hexagon className="w-6 h-6 text-amber fill-amber/10" />
                </div>
             </div>
             <div>
               <h1 className="font-fraunces text-xl font-bold tracking-tight text-ink-navy leading-tight inline-flex items-center gap-1.5">
                  AI Tailor <Sparkles className="w-4 h-4 text-amber" />
               </h1>
             </div>
           </div>

           <div className="flex items-center gap-2">
              <button
                 onClick={handleLogout}
                 className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-ink-navy/60 hover:text-ink-navy transition-all rounded-[14px] bg-white hover:bg-gray-50 border border-gray-100 shadow-sm hover:shadow"
              >
                 Log Out
                 <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
           </div>
        </header>

        {/* Hero Area */}
        <div className="text-center mb-12 flex flex-col items-center">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm mb-6 text-sm font-semibold text-amber">
              <Waves className="w-4 h-4" /> Start optimizing your career
           </div>
           
           <h2 className="font-fraunces text-4xl sm:text-5xl lg:text-5xl font-bold text-ink-navy tracking-tight mb-5 leading-tight">
              Craft the Perfect Resume <br className="hidden md:block" />
              <span className="relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-amber via-orange-500 to-amber font-sans">in Seconds.</span>
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-amber/20 z-0" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="4" fill="transparent"/></svg>
              </span>
           </h2>
           <p className="text-ink-navy/60 text-lg max-w-xl">
              Transform your ordinary base resume into an ATS-destroying, tailored masterpiece. Upload below to ignite the engine.
           </p>
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
           
           {/* Upload Side */}
           <div className="col-span-1 lg:col-span-5 h-full">
              <div className="relative group rounded-[32px] h-full">
                 <div className="absolute -inset-1 blur-xl bg-gradient-to-tr from-amber/30 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[32px]" />
                 <div className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col items-center p-2">
                    <ResumeUploader onUploadSuccess={handleUploadSuccess} />
                 </div>
              </div>
           </div>

           {/* List Side */}
           <div className="col-span-1 lg:col-span-7">
              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 md:p-8 min-h-[450px]">
                 <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 relative">
                    <div>
                       <h3 className="font-fraunces text-2xl font-bold text-ink-navy">Document Library</h3>
                       <p className="text-ink-navy/50 text-sm mt-1">Select a base resume to generate a tailored version.</p>
                    </div>
                 </div>
                 
                 <ResumeList refreshKey={refreshKey} />
              </div>
           </div>
           
        </div>
      </div>
    </div>
  );
}

