
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
  const { user, loading: isUserLoading, signOut } = useSupabaseAuth();
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
      } catch (_e) {}
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
        console.log("[Identity Protocol] Static password match!");
        // Authenticate via Supabase if possible, but prioritize the match
        try {
          const { data: authData } = await supabase.auth.signInWithPassword({
            email: targetEmail,
            password: password,
          });
          
          if (!authData.user) throw new Error("Supabase auth failed");
        } catch (e) {
          console.warn("[Identity Protocol] Supabase auth failed, using static fallback:", e);
          // Establish a Static Session for the provider to pick up
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
        }
        
        // Use a slight delay or window.location to ensure session is picked up
        setTimeout(() => {
          if (storedRole === "admin") {
            window.location.href = "/dashboard/admin";
          } else if (storedRole === "trader") {
            window.location.href = "/dashboard/trader";
          } else if (storedRole === "agent") {
            window.location.href = "/dashboard/agent";
          } else {
            window.location.href = "/dashboard/client";
          }
        }, 100);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-transparent font-body overflow-hidden relative selection:bg-primary/30">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary/5 blur-[120px] -z-10" />

      <div className="absolute top-10 right-10">
        <ISTTimer />
      </div>

      <div className="w-full max-w-md space-y-12 animate-in-scale">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-primary rounded-[2rem] flex items-center justify-center border border-white/10 mx-auto glow-primary-lg shadow-2xl transition-transform hover:scale-105 duration-500">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <div className="space-y-2">
            <h1 className="font-headline text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">ConnectCrypto</h1>
            <p className="text-[10px] text-primary font-black uppercase tracking-[0.5em] opacity-80">Institutional Identity Gate</p>
          </div>
        </div>

        {errorHint && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[1.5rem] animate-pulse">
            <p className="text-[10px] text-red-500 uppercase font-black text-center tracking-widest">Access Denied: Invalid credentials.</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="glass-card p-10 rounded-[3rem] border border-white/10 space-y-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors duration-700" />
          
          <div className="space-y-3">
            <Label className="text-hierarchy-label ml-2">Username</Label>
            <div className="relative">
              <Input name="email" type="text" placeholder="Your Username" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20" required />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-hierarchy-label ml-2">Secure Passphrase</Label>
            <div className="relative">
              <Input name="password" type="password" placeholder="••••••••" className="bg-white/5 border-white/10 h-16 rounded-2xl text-white px-6 focus:ring-primary/50 font-bold placeholder:opacity-20" required />
            </div>
          </div>

          <Button type="submit" className="w-full h-20 bg-primary hover:bg-primary/90 glow-primary-lg font-black text-[11px] uppercase tracking-[0.4em] rounded-2xl text-white transition-all hover:scale-[1.02] active:scale-95" disabled={loading}>
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Authorize Session"}
          </Button>
        </form>

        <div className="space-y-6">
          <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-40">
            Identity Not Found? <Link href="/auth/register" className="text-primary hover:text-primary/80 transition-colors underline underline-offset-4">Create Portal</Link>
          </p>
          
          <div className="flex items-center justify-center gap-6 opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
             <div className="h-[1px] bg-white/20 flex-1" />
             <span className="text-[8px] font-black uppercase tracking-[0.5em]">Verified Protocol</span>
             <div className="h-[1px] bg-white/20 flex-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
