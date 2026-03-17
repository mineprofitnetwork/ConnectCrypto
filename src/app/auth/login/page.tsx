
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/lib/supabase-auth-provider";
import { supabase } from "@/lib/supabase";
import { ISTTimer } from "@/components/ui/ist-timer";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isUserLoading } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [errorHint, setErrorHint] = useState(false);

  useEffect(() => {
    // Check for static user first
    const staticUserJson = typeof window !== 'undefined' ? sessionStorage.getItem('static_user') : null;
    if (staticUserJson) {
      try {
        const staticUser = JSON.parse(staticUserJson);
        if (staticUser.role === 'admin') router.push('/dashboard/admin');
        else if (staticUser.role === 'trader') router.push('/dashboard/trader');
        else if (staticUser.role === 'agent') router.push('/dashboard/agent');
        else router.push('/dashboard/client');
        return;
      } catch {
        // Ignore error
      }
    }

    if (user && !isUserLoading) {
      // Role-based redirection logic
      const checkRoleAndRedirect = async () => {
        try {
          const { data: userData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (userData && !profileError) {
            if (userData.role === "admin") {
              router.push("/dashboard/admin");
            } else if (userData.role === "trader") {
              router.push("/dashboard/trader");
            } else if (userData.role === "agent") {
              router.push("/dashboard/agent");
            } else {
              router.push("/dashboard/client");
            }
          } else {
            // Fallback for cases where profile doesn't exist yet
            router.push("/dashboard/client");
          }
        } catch (e) {
          console.error("Redirection error:", e);
          router.push("/dashboard/client");
        }
      };
      
      checkRoleAndRedirect();
    }
  }, [user, isUserLoading, router]);

  const findUserByAlias = async (alias: string) => {
    try {
      const cleanAlias = alias.trim().toLowerCase().replace(/\s+/g, '_');
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanAlias)
        .single();
      
      if (data && !error) {
        return data;
      }
    } catch (e) {
      console.error("[Identity Protocol] Alias lookup error:", e);
    }
    return null;
  };

  const findUserByEmail = async (email: string) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", cleanEmail)
        .single();
      
      if (data && !error) {
        return data;
      }
    } catch (e) {
      console.error("[Identity Protocol] Email lookup error:", e);
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorHint(false);

    const formData = new FormData(e.currentTarget);
    const identifierInput = (formData.get("email") as string).trim();
    const password = formData.get("password") as string;

    const loginEmail = identifierInput.toLowerCase();

    // Static lookup for custom overrides
    let targetEmail = loginEmail;
    let storedPassword = null;
    let storedRole = null;
    let storedUsername = null;
    let userProfile = null;

    if (!loginEmail.includes("@")) {
      userProfile = await findUserByAlias(identifierInput);
    } else {
      userProfile = await findUserByEmail(loginEmail);
    }

    if (userProfile) {
      targetEmail = userProfile.email;
      storedPassword = userProfile.password_hash; // Updated to match schema
      storedRole = userProfile.role;
      storedUsername = userProfile.username;
      console.log("[Identity Protocol] Profile Data:", {
        email: targetEmail,
        role: storedRole,
        username: storedUsername,
        hasPassword: !!storedPassword,
        passwordValue: storedPassword // TEMPORARY DEBUG
      });
    }

    try {
      console.log("[Identity Protocol] Attempting login for:", targetEmail);
      // 1. Attempt Static Override first (for the 'easy' flow)
      if (storedPassword && storedPassword === password) {
        console.log("[Identity Protocol] Static password match! Establishing session...");
        
        // Establish a Static Session for the provider and dashboard to pick up
        const staticUser = {
          id: userProfile?.id || targetEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          email: targetEmail,
          user_metadata: {
            username: storedUsername || identifierInput,
            role: storedRole
          },
          role: storedRole,
          isStatic: true
        };
        sessionStorage.setItem('static_user', JSON.stringify(staticUser));
        
        // IMMEDIATELY redirect to the correct dashboard
        const dashboardPath = storedRole === "admin" ? "/dashboard/admin" : 
                             storedRole === "trader" ? "/dashboard/trader" :
                             storedRole === "agent" ? "/dashboard/agent" : "/dashboard/client";
        
        console.log("[Identity Protocol] Redirecting to:", dashboardPath);
        window.location.href = dashboardPath;
        return;
      }

      // 2. Fallback to standard Supabase Auth Login
      const { data: { user: authUser }, error: loginError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (loginError) throw loginError;
      if (!authUser) throw new Error("No user found");
      
      // Force fetch fresh doc
      const { data: userData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (profileError) throw profileError;

      if (userData?.role === "admin" || targetEmail === "iamadmin@connectcrypto.com" || identifierInput === "iamadmin") {
        window.location.href = "/dashboard/admin";
      } else if (userData?.role === "trader" || targetEmail === "iamtrader@connectcrypto.com" || identifierInput === "iamtrader") {
        window.location.href = "/dashboard/trader";
      } else if (userData?.role === "agent") {
        window.location.href = "/dashboard/agent";
      } else {
        window.location.href = "/dashboard/client";
      }

    } catch (error) {
      console.error("Login Protocol Error:", error);
      toast({ variant: "destructive", title: "Access Denied", description: "Invalid credentials." });
      setErrorHint(true);
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-stretch bg-transparent font-body selection:bg-primary/30 relative overflow-hidden">
      {/* Decorative background for the whole page */}
      <div className="absolute inset-0 bg-black/40 -z-20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-primary/[0.02] blur-[120px] -z-10" />

      {/* Left Side: Branding & Info (Desktop Only) */}
      <div className="hidden lg:flex flex-col justify-center p-24 w-[45%] relative overflow-hidden border-r border-white/5 bg-black/20">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-30" />
        
        <div className="relative z-10 space-y-16 animate-in-slide-up">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center border border-white/10 glow-primary-lg shadow-2xl transition-transform hover:rotate-6 duration-700">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
          
          <div className="space-y-6">
            <h1 className="font-headline text-7xl xl:text-8xl font-black text-white uppercase tracking-tighter leading-[0.85] italic">
              Connect<br />
              <span className="text-primary">Crypto</span>
            </h1>
            <p className="text-sm text-primary font-black uppercase tracking-[0.6em] opacity-80">Institutional Identity Gate</p>
          </div>

          <p className="text-white/40 text-base xl:text-lg max-w-md leading-relaxed font-medium uppercase tracking-widest italic">
            Access the global standard for secure decentralized P2P settlements. Experience zero-latency verification and institutional liquidity nodes.
          </p>

          <div className="flex items-center gap-12 pt-12 border-t border-white/5 w-fit">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Protocol Status</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-xl font-headline font-black text-white uppercase italic">Active</span>
              </div>
            </div>
            <div className="w-[1px] h-12 bg-white/10" />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Security Tier</span>
              <span className="text-xl font-headline font-black text-white uppercase italic">Level 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 relative">
        <div className="absolute top-10 right-10 z-50">
          <ISTTimer />
        </div>

        <div className="w-full max-w-md space-y-10 animate-in-scale relative z-10">
          {/* Mobile Branding (Visible only when sidebar is hidden) */}
          <div className="lg:hidden text-center space-y-6 mb-12">
            <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center border border-white/10 mx-auto glow-primary shadow-2xl">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <div className="space-y-2">
              <h1 className="font-headline text-4xl font-black text-white uppercase tracking-tighter italic">ConnectCrypto</h1>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">Institutional Identity Gate</p>
            </div>
          </div>

          <div className="space-y-10">
            <div className="space-y-2 hidden lg:block">
              <h2 className="text-3xl font-headline font-black text-white uppercase tracking-tight italic">Secure Access</h2>
              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Enter your protocol credentials to authorize session</p>
            </div>

            {errorHint && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] animate-pulse">
                <p className="text-[10px] text-red-500 uppercase font-black text-center tracking-widest italic">Access Denied: Identity mismatch detected.</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="glass-card p-10 xl:p-12 rounded-[3.5rem] border border-white/10 space-y-10 relative overflow-hidden group/form">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/form:bg-primary/10 transition-colors duration-700" />
              
              <div className="space-y-4">
                <Label className="text-hierarchy-label ml-2">Protocol Identity / Email</Label>
                <div className="relative group/input">
                  <Input 
                    name="email" 
                    type="text" 
                    placeholder="e.g. johndoe" 
                    className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 transition-all group-hover/input:bg-white/[0.08]" 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <Label className="text-hierarchy-label">Secure Passphrase</Label>
                  <button type="button" className="text-[9px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Forgot?</button>
                </div>
                <div className="relative group/input">
                  <Input 
                    name="password" 
                    type="password" 
                    placeholder="••••••••" 
                    className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-8 focus:ring-primary/50 font-bold placeholder:opacity-20 transition-all group-hover/input:bg-white/[0.08]" 
                    required 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-20 bg-primary hover:bg-primary/90 glow-primary-lg font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <div className="flex items-center justify-center gap-3">
                    <span>Authorize Session</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="space-y-8">
              <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-40">
                Identity Not Found? <Link href="/auth/register" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">Create New Portal</Link>
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
