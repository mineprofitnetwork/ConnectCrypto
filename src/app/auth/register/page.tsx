"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth-provider";
import { ISTTimer } from "@/components/ui/ist-timer";
import { User, Profile } from "@/types";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { loading: authLoading } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref.toUpperCase());
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;
    const username = (formData.get("username") as string).trim().toLowerCase().replace(/\s+/g, '_');
    const refCode = (formData.get("referralCode") as string || "").trim().toUpperCase();

    try {
      let agentData: Profile | null = null;
      if (refCode) {
        const { data: agentSnap, error: agentError } = await supabase
          .from("profiles")
          .select("*")
          .eq("referral_code", refCode)
          .eq("role", "agent")
          .single();

        if (agentError || !agentSnap) {
          toast({ variant: "destructive", title: "Invalid Referral", description: "The referral code provided is not authorized." });
          setLoading(false);
          return;
        }
        agentData = agentSnap;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role: "client"
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Identity creation failed.");

      const newUserProfile: any = {
        id: authData.user.id,
        email,
        username,
        full_name: fullName,
        is_active: true,
        role: "client",
        created_at: new Date().toISOString()
      };

      if (agentData) {
        newUserProfile.agent_id = agentData.id;
        newUserProfile.trader_id = agentData.trader_id;
      }

      const { error: profileError } = await supabase.from("profiles").upsert(newUserProfile);
      if (profileError) throw profileError;

      toast({ title: "Identity Established", description: `Welcome, ${username}. Please check your email for verification if required.` });
      router.push("/dashboard/client");

    } catch (error: any) {
      console.error(error);
      setAuthError(error.message || "Failed to establish identity.");
    } finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-2xl space-y-12 py-20 animate-in-scale">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/20 mx-auto glow-primary shadow-2xl transition-transform hover:scale-105 duration-500">
            <ShieldCheck className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="font-headline text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic">Creation Portal</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em] opacity-80">Establish New Protocol Identity</p>
          </div>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[1.5rem] animate-pulse">
            <p className="text-[10px] text-red-500 uppercase font-black text-center tracking-widest">{authError}</p>
          </div>
        )}

        <form onSubmit={handleRegister} className="glass-card p-10 rounded-[3rem] border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700" />

          <div className="space-y-3">
            <Label className="text-hierarchy-label ml-2">Legal Identity Name</Label>
            <Input name="fullName" placeholder="e.g. John Doe" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20" required />
          </div>
          <div className="space-y-3">
            <Label className="text-hierarchy-label ml-2">Network Alias</Label>
            <Input name="username" placeholder="e.g. johndoe" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20" required />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label className="text-hierarchy-label ml-2">Official Protocol Email</Label>
            <Input name="email" type="email" placeholder="john@protocol.com" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20" required />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label className="text-hierarchy-label ml-2">Secure Passphrase</Label>
            <Input name="password" type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20" required />
          </div>

          <div className="space-y-3 md:col-span-2">
            <Label className="text-hierarchy-label ml-2 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-primary" /> Protocol Referral Code (Optional)
            </Label>
            <Input name="referralCode" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="AGENTCODE123" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20 uppercase" />
          </div>

          <Button type="submit" className="md:col-span-2 w-full h-20 bg-primary hover:bg-primary/90 glow-primary-lg font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95 mt-4" disabled={loading}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commit Identity Creation"}
          </Button>
        </form>

        <div className="space-y-6">
          <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-40">
            Existing Identity? <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">Identity Gate</Link>
          </p>
          
          <div className="flex items-center justify-center gap-6 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="h-[1px] bg-white/20 flex-1" />
             <span className="text-[8px] font-black uppercase tracking-[0.5em]">Verified Creation Hub</span>
             <div className="h-[1px] bg-white/20 flex-1" />
          </div>
        </div>
      </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent font-body overflow-y-auto no-scrollbar relative selection:bg-primary/30">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] -z-10" />

      <div className="absolute top-10 right-10">
        <ISTTimer />
      </div>

      <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}

