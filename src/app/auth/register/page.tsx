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
import { ISTTimer } from "@/components/ui/ist-timer";
import { Profile } from "@/types";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
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

      const newUserProfile: Partial<Profile> = {
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

    } catch (error: unknown) {
      console.error(error);
      setAuthError((error as Error).message || "Failed to establish identity.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-transparent font-body selection:bg-primary/30 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-black/40 -z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/[0.02] blur-[120px] -z-10" />

      {/* Left Side: Branding & Info (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-center p-24 w-[40%] relative overflow-hidden border-r border-white/5 bg-black/20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30" />
        
        <div className="relative z-10 space-y-16 animate-in-slide-up">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center border border-white/10 glow-primary shadow-2xl transition-transform hover:-rotate-6 duration-700">
            <ShieldCheck className="w-12 h-12 text-white" />
          </div>
          
          <div className="space-y-6">
            <h1 className="font-headline text-7xl xl:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] italic">
              Creation<br />
              <span className="text-primary">Portal</span>
            </h1>
            <p className="text-sm text-primary font-black uppercase tracking-[0.6em] opacity-80">Establish New Protocol Identity</p>
          </div>

          <div className="space-y-8">
            <p className="text-white/40 text-base xl:text-lg max-w-md leading-relaxed font-medium uppercase tracking-widest italic">
              Join the institutional network. Your identity will be secured using multi-layer encryption and verified against global compliance standards.
            </p>

            <div className="grid grid-cols-1 gap-6 pt-8 border-t border-white/5">
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Zero-Trust Security Architecture</p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-primary/40 transition-colors">
                  <Link2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Automated Referral Attribution</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Register Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 relative overflow-y-auto no-scrollbar">
        <div className="absolute top-10 right-10 z-50">
          <ISTTimer />
        </div>

        <div className="w-full max-w-2xl space-y-10 animate-in-scale relative z-10 py-20">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center space-y-6 mb-12">
            <div className="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center border border-primary/20 mx-auto glow-primary">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-black text-white uppercase tracking-tighter italic">Creation Portal</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">Establish New Protocol Identity</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-2 hidden lg:block">
              <h2 className="text-3xl font-headline font-black text-white uppercase tracking-tight italic">Protocol Registration</h2>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Provide legal identity details to establish a new node</p>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] animate-pulse">
                <p className="text-[10px] text-red-500 uppercase font-black text-center tracking-widest italic">{authError}</p>
              </div>
            )}

            <form onSubmit={handleRegister} className="glass-card p-10 xl:p-12 rounded-[3.5rem] border border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 relative overflow-hidden group/form">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/form:bg-primary/10 transition-colors duration-700" />

              <div className="space-y-4">
                <Label className="text-hierarchy-label ml-2">Legal Identity Name</Label>
                <div className="relative group/input">
                  <Input name="fullName" placeholder="e.g. John Doe" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 transition-all group-hover/input:bg-white/[0.08]" required />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-hierarchy-label ml-2">Network Alias</Label>
                <div className="relative group/input">
                  <Input name="username" placeholder="e.g. johndoe" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 transition-all group-hover/input:bg-white/[0.08]" required />
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <Label className="text-hierarchy-label ml-2">Official Protocol Email</Label>
                <div className="relative group/input">
                  <Input name="email" type="email" placeholder="john@protocol.com" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 transition-all group-hover/input:bg-white/[0.08]" required />
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <Label className="text-hierarchy-label ml-2">Secure Passphrase</Label>
                <div className="relative group/input">
                  <Input name="password" type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 transition-all group-hover/input:bg-white/[0.08]" required />
                </div>
              </div>

              <div className="space-y-4 md:col-span-2">
                <Label className="text-hierarchy-label ml-2 flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-primary" /> Protocol Referral Code (Optional)
                </Label>
                <div className="relative group/input">
                  <Input name="referralCode" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="AGENTCODE123" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 uppercase transition-all group-hover/input:bg-white/[0.08]" />
                </div>
              </div>

              <Button type="submit" className="md:col-span-2 w-full h-20 bg-primary hover:bg-primary/90 glow-primary-lg font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 mt-4" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Commit Identity Creation"}
              </Button>
            </form>

            <div className="space-y-8">
              <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-40">
                Existing Identity? <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">Identity Gate</Link>
              </p>
              
              <div className="flex items-center justify-center gap-8 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000">
                 <div className="h-[1px] bg-white/20 flex-1" />
                 <span className="text-[9px] font-black uppercase tracking-[0.5em] italic">Institutional Protocol v4.0</span>
                 <div className="h-[1px] bg-white/20 flex-1" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}

export default RegisterPage;

