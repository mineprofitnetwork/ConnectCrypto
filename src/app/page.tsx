"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/firebase";
import { Loader2, ShieldCheck, Zap } from "lucide-react";

export default function Home() {
  const { isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      const timer = setTimeout(() => {
        router.replace("/auth/login");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isUserLoading, router]);

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 relative overflow-hidden" role="banner">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center gap-12 text-center">
        <div className="relative">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center glow-primary shadow-2xl relative z-10 animate-pulse">
            <Zap className="w-12 h-12 text-white fill-white" aria-hidden="true" />
          </div>
          <div className="absolute inset-0 bg-primary/40 rounded-[2.5rem] blur-xl animate-pulse" aria-hidden="true" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-headline font-bold uppercase tracking-[0.4em] text-white">ConnectCrypto</h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-[1px] w-8 bg-white/20" aria-hidden="true" />
            <p className="text-[10px] text-primary font-bold uppercase tracking-[0.3em]">Institutional Node v4.5</p>
            <div className="h-[1px] w-8 bg-white/20" aria-hidden="true" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="flex items-center gap-3 py-3 px-6 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
            <Loader2 className="w-4 h-4 text-primary animate-spin" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Synchronizing Protocol...</span>
          </div>
          
          <div className="flex items-center gap-2 opacity-40">
            <ShieldCheck className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Quantum-Secure Channel</span>
          </div>
        </div>
      </div>

      <footer className="absolute bottom-12 text-center">
        <p className="text-[8px] text-white/20 font-bold uppercase tracking-[0.5em]">Global Liquidity Hub &copy; 2026</p>
      </footer>
    </main>
  );
}
