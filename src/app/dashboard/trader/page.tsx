
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Loader2, 
  Settings, 
  UserCircle, 
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Coins,
  History as HistoryIcon,
  CreditCard,
  Edit2,
  Copy as CopyIcon,
  Headset,
  Mail,
  Send,
  Phone,
  Clock,
  Users,
  Percent,
} from "lucide-react";
import { useSupabaseAuth } from "@/lib/supabase-auth-provider";
import { useSupabaseQuery, useSupabaseDoc } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ISTTimer } from "@/components/ui/ist-timer";
import { USDTGoldLogo } from "@/components/logos/USDTGoldLogo";
import { USDTOriginalLogo } from "@/components/logos/USDTOriginalLogo";
import Image from "next/image";
import { User, TradeTransaction, WithdrawalRequest, TraderOffer, Profile } from "@/types";

export default function TraderDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isUserLoading, signOut } = useSupabaseAuth();

  const [activeTab, setActiveTab] = useState("offers");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  
  const [offerCrypto, setOfferCrypto] = useState("USDT");
  const [offerNetwork, setOfferNetwork] = useState("TRC20");
  const [offerFiat, setOfferFiat] = useState("INR");
  const [offerPrice, setOfferPrice] = useState("95.5");
  const [offerDisplayName, setOfferDisplayName] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerIconCid, setOfferIconCid] = useState("");

  // Agent Management States
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentUsername, setNewAgentUsername] = useState("");
  const [newAgentPass, setNewAgentPass] = useState("agent123");
  const [isProvisioningAgent, setIsProvisioningAgent] = useState(false);
  const [isAgentProvisionOpen, setIsAgentProvisionOpen] = useState(false);

  const { data: userData, loading: isUserDataLoading } = useSupabaseDoc<Profile>("profiles", user?.id);

  const { data: pendingTrades } = useSupabaseQuery<TradeTransaction>("trade_transactions", {
    select: "*",
    eq: ["trader_id", user?.id],
    order: ["initiation_time", { ascending: false }],
    limit: 100
  });

  const { data: myOffers } = useSupabaseQuery<TraderOffer>("trader_buy_offers", {
    eq: ["trader_id", user?.id],
    order: ["created_at", { ascending: false }],
    limit: 50
  });

  const { data: successTrades } = useSupabaseQuery<TradeTransaction>("trade_transactions", {
    select: "*",
    eq: ["trader_id", user?.id],
    order: ["initiation_time", { ascending: false }],
    limit: 200
  });

  const { data: gateways } = useSupabaseQuery<any>("fiat_payment_methods", {
    eq: ["user_id", user?.id],
    order: ["created_at", { ascending: false }],
    limit: 20
  });

  const { data: allWithdrawals } = useSupabaseQuery<WithdrawalRequest>("withdrawals", {
    eq: ["trader_id", user?.id],
    order: ["created_at", { ascending: false }],
    limit: 100
  });

  const { data: myAgents } = useSupabaseQuery<Profile>("profiles", {
    eq: ["trader_id", user?.id],
    limit: 50
  });

  const { data: globalSettings } = useSupabaseDoc<any>("global_settings", "default");
  const brandingSettings = globalSettings?.branding;

  const totalCryptoReceived = useMemo(() => {
    if (!successTrades) return 0;
    return successTrades.reduce((acc, trade) => acc + (trade.crypto_amount || 0), 0);
  }, [successTrades]);

  const totalMoneyPaid = useMemo(() => {
    if (!allWithdrawals) return 0;
    return allWithdrawals
      .filter(w => w.status === "Success")
      .reduce((acc, w) => acc + (w.amount || 0), 0);
  }, [allWithdrawals]);

  const totalMoneyToPay = useMemo(() => {
    const totalFiatReceived = successTrades?.reduce((acc, trade) => acc + (trade.fiat_amount || 0), 0) || 0;
    return totalFiatReceived - totalMoneyPaid;
  }, [successTrades, totalMoneyPaid]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/auth/login");
    } else if (!isUserLoading && user && !isUserDataLoading && userData) {
      // Role-based redirection
      if (userData.role === "admin" || userData.username === "iamadmin") {
        router.replace("/dashboard/admin");
      } else if (userData.role !== "trader" && userData.username !== "iamtrader") {
        router.replace("/dashboard/client");
      }
    }
  }, [user, isUserLoading, isUserDataLoading, userData, router]);

  if (isUserLoading || isUserDataLoading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get("fullName"),
      username: formData.get("username")
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (!error) toast({ title: "Profile Updated" });
  };

  const handleUpdateWallets = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      wallet_address_trc20: formData.get("trc20")?.toString().trim() || "",
      wallet_qr_trc20: formData.get("trc20Qr")?.toString().trim() || "",
      wallet_address_bep20: formData.get("bep20")?.toString().trim() || "",
      wallet_qr_bep20: formData.get("bep20Qr")?.toString().trim() || "",
      wallet_address_erc20: formData.get("erc20")?.toString().trim() || "",
      wallet_qr_erc20: formData.get("erc20Qr")?.toString().trim() || "",
      referral_commission: parseFloat(formData.get("commission")?.toString() || "0")
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (!error) toast({ title: "Institutional Wallets Updated", description: "All new offers will use these endpoints." });
  };

  const generateAgentUsername = () => {
    const prefixes = ["crypto", "node", "nexus", "pro", "zen", "alpha", "flux", "bit", "vault", "link"];
    const suffixes = ["agent", "trader", "expert", "master", "partner", "lead", "pulse", "core"];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const randomNumber = Math.floor(Math.random() * 999);
    setNewAgentUsername(`${randomPrefix}_${randomSuffix}_${randomNumber}`);
  };

  const generateReferralCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleProvisionAgent = async () => {
    if (!user || !newAgentEmail || !newAgentUsername || !newAgentPass) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsProvisioningAgent(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAgentEmail.trim().toLowerCase(),
        password: newAgentPass,
        options: {
          data: {
            username: newAgentUsername.trim().toLowerCase().replace(/\s+/g, '_'),
            role: "agent"
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("SignUp failed");

      const agentData = {
        id: authData.user.id,
        email: newAgentEmail.trim().toLowerCase(),
        username: newAgentUsername.trim().toLowerCase().replace(/\s+/g, '_'),
        password_hash: newAgentPass,
        role: "agent",
        trader_id: user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        referral_code: generateReferralCode()
      };

      const { error: profileError } = await supabase.from("profiles").upsert(agentData);
      if (profileError) throw profileError;

      toast({ title: "Agent Provisioned", description: `${newAgentUsername} is now authorized for your node.` });
      setNewAgentEmail("");
      setNewAgentUsername("");
      setNewAgentPass("agent123");
      setIsAgentProvisionOpen(false);
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Provisioning Failed", description: e.message });
    } finally {
      setIsProvisioningAgent(false);
    }
  };

  const IPFSPreview = ({ cid, label, className }: { cid: string; label: string; className?: string }) => {
    const isUSDT = label?.toUpperCase().includes("USDT");
    const targetCid = isUSDT ? "bafybeicygbg5kw4b5wyzx7rsv7zen5qmgda6jkn57phoqhp67jji7fpefa" : cid;
    if (!targetCid || targetCid.trim().length < 10) return null;
    
    return (
      <div className={`flex flex-col items-center justify-center rounded-full shrink-0 relative group overflow-hidden ${className || 'w-16 h-16'} ${isUSDT ? '' : 'bg-white/5 border border-white/10'}`}>
        <Image 
          src={`https://ipfs.io/ipfs/${targetCid.trim()}`} 
          alt={label} 
          fill 
          className="object-cover opacity-80 group-hover:opacity-100 transition-opacity scale-[0.8]"
          unoptimized 
        />
        {!isUSDT && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <ImageIcon className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  const handleOpenPosition = async () => {
    if (!user || !offerPrice) return;
    
    const offerData = {
      trader_id: user.id,
      trader_username: userData?.username || "Verified Node",
      display_name: offerDisplayName.trim() || userData?.username || "Verified Node",
      crypto_asset_id: offerCrypto.toUpperCase(),
      network: offerNetwork.toUpperCase(),
      fiat_currency: offerFiat.toUpperCase(),
      fixed_price_per_crypto: parseFloat(offerPrice),
      description: offerDescription,
      icon_cid: offerIconCid.trim(),
      wallet_address_trc20: userData?.wallet_address_trc20 || "",
      wallet_address_bep20: userData?.wallet_address_bep20 || "",
      wallet_address_erc20: userData?.wallet_address_erc20 || "",
      wallet_qr_trc20: userData?.wallet_qr_trc20 || "",
      wallet_qr_bep20: userData?.wallet_qr_bep20 || "",
      wallet_qr_erc20: userData?.wallet_qr_erc20 || "",
      status: "Active"
    };

    if (editingOfferId) {
      const { error } = await supabase.from("trader_buy_offers").update(offerData).eq("id", editingOfferId);
      if (!error) toast({ title: "Position Updated" });
    } else {
      const { error } = await supabase.from("trader_buy_offers").insert(offerData);
      if (!error) toast({ title: "Position Opened" });
    }

    setIsAddOfferOpen(false);
    setEditingOfferId(null);
    resetOfferForm();
  };

  const resetOfferForm = () => {
    setOfferCrypto("USDT");
    setOfferNetwork("TRC20");
    setOfferFiat("INR");
    setOfferPrice("95.5");
    setOfferDisplayName("");
    setOfferDescription("");
    setOfferIconCid("");
  };

  const handleEditOffer = (off: TraderOffer) => {
    setEditingOfferId(off.id);
    setOfferCrypto(off.crypto_asset_id);
    setOfferNetwork(off.network);
    setOfferFiat(off.fiat_currency);
    setOfferPrice(off.fixed_price_per_crypto.toString());
    setOfferDisplayName(off.display_name || "");
    setOfferDescription(off.description || "");
    setOfferIconCid(off.icon_cid || "");
    setIsAddOfferOpen(true);
  };

  const handleDuplicateOffer = (off: TraderOffer) => {
    setEditingOfferId(null); 
    setOfferCrypto(off.crypto_asset_id);
    setOfferNetwork(off.network);
    setOfferFiat(off.fiat_currency);
    setOfferPrice(off.fixed_price_per_crypto.toString());
    setOfferDisplayName(off.display_name || "");
    setOfferDescription(off.description || "");
    setOfferIconCid(off.icon_cid || "");
    setIsAddOfferOpen(true);
    toast({ title: "Draft Created", description: "Offer details duplicated. Review and publish." });
  };

  const handleApproveTrade = async (trade: TradeTransaction) => {
    try {
      const { error: tradeError } = await supabase.from("trade_transactions").update({ status: "Success" }).eq("id", trade.id);
      if (tradeError) throw tradeError;

      // Update Client Balance
      const { data: clientProfile } = await supabase.from("profiles").select("balance").eq("id", trade.client_id).single();
      const newClientBalance = (clientProfile?.balance || 0) + trade.fiat_amount;
      await supabase.from("profiles").update({ balance: newClientBalance }).eq("id", trade.client_id);

      // Update Trader Balance
      if (user) {
        const { data: traderProfile } = await supabase.from("profiles").select("balance").eq("id", user.id).single();
        const newTraderBalance = (traderProfile?.balance || 0) + trade.fiat_amount;
        await supabase.from("profiles").update({ balance: newTraderBalance }).eq("id", user.id);
      }

      toast({ title: "Trade Approved", description: "Funds released to client wallet." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Protocol Error", description: typeof e === 'string' ? e : "Failed to release funds." });
    }
  };

  const handleTradeStatusUpdate = async (trade: TradeTransaction, newStatus: string) => {
    try {
      const { error } = await supabase.from("trade_transactions").update({ status: newStatus }).eq("id", trade.id);
      if (!error) toast({ title: "Status Updated", description: `Trade status changed to ${newStatus}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update trade status." });
    }
  };

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, newStatus: string) => {
    try {
      if (newStatus === "Success") {
        const { data: userProfile } = await supabase.from("profiles").select("balance").eq("id", withdrawal.user_id).single();
        const currentBalance = userProfile?.balance || 0;
        
        if (currentBalance < withdrawal.amount) {
          throw "Insufficient Balance";
        }

        const { error: withdrawalError } = await supabase.from("withdrawals").update({ status: "Success", processed_at: new Date().toISOString() }).eq("id", withdrawal.id);
        if (withdrawalError) throw withdrawalError;

        await supabase.from("profiles").update({ balance: currentBalance - withdrawal.amount }).eq("id", withdrawal.user_id);
        
        toast({ title: "Withdrawal Marked as Paid", description: "Balance deducted and status updated." });
      } else {
        const { error } = await supabase.from("withdrawals").update({ status: newStatus }).eq("id", withdrawal.id);
        if (!error) toast({ title: "Status Updated", description: `Withdrawal status changed to ${newStatus}.` });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: typeof e === 'string' ? e : "Failed to update withdrawal status." });
    }
  };

  if (isUserLoading || isUserDataLoading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  // Strict Auth Guard: Only allow if user is authenticated and is a trader or admin
  const isAuthorized = user && userData && (userData.role === "trader" || userData.username === "iamtrader" || userData.role === "admin" || userData.username === "iamadmin");

  if (!isAuthorized) {
    return null; // Return nothing while redirecting in useEffect
  }

  const navItems = [
    { id: "queue", label: "Verification", icon: Zap },
    { id: "settlements", label: "Payouts", icon: CreditCard },
    { id: "offers", label: "Positions", icon: LayoutDashboard },
    { id: "agents", label: "Agents", icon: Users },
    { id: "history", label: "Ledger", icon: HistoryIcon },
    { id: "support", label: "Support", icon: Headset },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "trust", label: "Trust", icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-body selection:bg-primary/30">
      <header className="h-20 border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl px-6 md:px-10 flex items-center justify-between shrink-0 z-[100]">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab("offers")}>
          <div className="transition-transform group-hover:scale-110 duration-500">
            {brandingSettings?.selectedLogo === 'gold' ? (
              <USDTGoldLogo className="w-10 h-10" />
            ) : (
              <USDTOriginalLogo className="w-10 h-10" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-lg md:text-xl uppercase tracking-tighter leading-none">{userData?.username || 'Trader Node'}</span>
            <span className="text-[9px] text-primary font-bold uppercase tracking-[0.3em] leading-none mt-1">Verified Authority</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <ISTTimer />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl h-11 w-11 border-white/10 bg-white/5 hover:bg-white/10 transition-all">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsSignOutDialogOpen(true)} className="rounded-xl h-11 w-11 border-white/10 bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-red-500 hidden md:flex">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/95 z-[200] p-10 flex flex-col items-center justify-center space-y-8 animate-in-scale">
           <div className="mb-6">
             <ISTTimer />
           </div>
           <nav className="flex flex-col items-center space-y-4">
             {navItems.map(item => (
               <button 
                 key={item.id} 
                 onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }} 
                 className={`text-2xl font-headline font-black uppercase tracking-[0.1em] flex items-center gap-4 transition-all hover:scale-105 ${activeTab === item.id ? 'text-primary' : 'text-white/60 hover:text-white'}`}
               >
                 <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'text-primary' : 'text-white/40'}`} /> 
                 {item.label}
               </button>
             ))}
           </nav>
           <div className="pt-10 border-t border-white/10 w-full max-w-xs flex flex-col items-center">
             <Button variant="ghost" onClick={() => { setIsSignOutDialogOpen(true); setMobileMenuOpen(false); }} className="text-muted-foreground uppercase font-bold tracking-[0.2em] hover:text-red-500 transition-colors h-14 text-xs">Sign Out</Button>
           </div>
           <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(false)} className="absolute top-8 right-8 rounded-full h-12 w-12 border-white/10 bg-white/5"><X className="w-6 h-6" /></Button>
        </div>
      )}

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2.5rem] max-w-sm p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline font-black uppercase tracking-tight text-white">Protocol Terminated</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed mt-2">
              Confirm disconnection from the Trader Node? All active positions will remain live.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8">
            <AlertDialogCancel className="rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { 
              sessionStorage.removeItem('static_user');
              await signOut(auth); 
              router.replace("/auth/login"); 
            }} className="bg-red-500 hover:bg-red-600 rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest text-white glow-primary transition-all">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 app-scroll-area">
        <div className="p-6 md:p-10 lg:p-12 space-y-10 pb-40">
            <div className="space-y-1">
              <p className="text-primary text-[10px] uppercase tracking-[0.4em] font-black mb-1">Hello, @{userData?.username || 'Verified'}</p>
              <h1 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tight leading-none">Institutional Feed</h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  <p className="text-green-500 text-[9px] uppercase tracking-[0.2em] font-black">Node Online</p>
                </div>
              </div>
            </div>
            {activeTab === "offers" && (
              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 flex-1 md:flex-none">
                   <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                      <Coins className="w-5 h-5 text-primary" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-hierarchy-label">USDT Received</span>
                      <span className="text-lg font-black font-mono text-white tracking-tight italic">{totalCryptoReceived.toLocaleString()} <span className="text-[10px] not-italic text-white/40">USDT</span></span>
                   </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 flex-1 md:flex-none">
                   <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-green-500" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-hierarchy-label">Money Paid</span>
                      <span className="text-lg font-black font-mono text-white tracking-tight italic">₹{totalMoneyPaid.toLocaleString()}</span>
                   </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 flex-1 md:flex-none">
                   <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-500" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-hierarchy-label">Money to Pay</span>
                      <span className="text-lg font-black font-mono text-white tracking-tight italic">₹{totalMoneyToPay.toLocaleString()}</span>
                   </div>
                </div>
                <Button onClick={() => setIsAddOfferOpen(true)} className="bg-primary glow-primary h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:scale-[1.02] transition-transform flex-1 md:flex-none">
                  <Plus className="w-5 h-5 mr-2" /> Open Position
                </Button>
              </div>
            )}
            {activeTab === "agents" && (
              <Button onClick={() => setIsAgentProvisionOpen(true)} className="bg-primary glow-primary h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:scale-[1.02] transition-transform flex-1 md:flex-none">
                <Plus className="w-5 h-5 mr-2" /> Provision Agent
              </Button>
            )}


        {activeTab === "offers" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in-scale">
            {myOffers?.map(off => (
              <Card key={off.id} className="glass-card border-none rounded-[2.5rem] p-6 flex flex-col min-h-[220px] justify-between space-y-6 hover:border-primary/40 transition-all duration-500 group/card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {off.icon_cid || off.crypto_asset_id?.toUpperCase().includes("USDT") ? (
                        <div className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 group-hover/card:scale-110 transition-transform duration-500 ${off.crypto_asset_id?.toUpperCase().includes("USDT") ? '' : 'border border-white/10 bg-white/5 shadow-inner'}`}>
                          <Image 
                            src={`https://ipfs.io/ipfs/${off.crypto_asset_id?.toUpperCase().includes("USDT") ? "bafybeicygbg5kw4b5wyzx7rsv7zen5qmgda6jkn57phoqhp67jji7fpefa" : off.icon_cid}`} 
                            alt={off.crypto_asset_id} 
                            fill 
                            className="object-cover scale-[0.8]" 
                            unoptimized 
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-6 h-6 text-muted-foreground opacity-20" />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] truncate opacity-80 mb-0.5">
                          {off.display_name}
                        </p>
                        <p className="font-headline font-black text-xl uppercase tracking-tighter text-white group-hover/card:text-primary transition-colors truncate">
                          {off.crypto_asset_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="ghost" size="icon" onClick={() => handleEditOffer(off)} className="h-8 w-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5"><Edit2 className="w-3.5 h-3.5" /></Button>
                       <Button variant="ghost" size="icon" onClick={() => handleDuplicateOffer(off)} className="h-8 w-8 rounded-lg text-white/40 hover:text-white hover:bg-white/5"><CopyIcon className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-white/5 flex justify-between items-end relative z-10">
                  <div className="flex flex-col gap-1">
                    <span className="text-hierarchy-label tracking-widest">Market Rate</span>
                    <p className="text-2xl font-headline font-black text-white leading-none italic group-hover/card:text-primary transition-colors tracking-tighter">{off.fixed_price_per_crypto} <span className="text-[10px] opacity-40 not-italic font-bold ml-1">{off.fiat_currency}</span></p>
                  </div>
                  <Badge variant="outline" className={`text-[9px] py-1 px-3 border-green-500/20 text-green-500 uppercase font-black tracking-widest bg-green-500/5 rounded-full`}>
                    {off.status}
                  </Badge>
                </div>
              </Card>
            ))}
            <button onClick={() => setIsAddOfferOpen(true)} className="border-2 border-dashed border-white/10 rounded-[2.5rem] h-[220px] flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-white/[0.02] transition-all group duration-500">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                 <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-white transition-colors">Create Position</span>
            </button>
          </div>
        ) : activeTab === "queue" ? (
           <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                   <Zap className="w-4 h-4 text-primary" /> Verification Queue
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                   <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Reference</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Client</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Asset Volume</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Fiat Value</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Status</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {pendingTrades?.length === 0 ? (
                         <TableRow><TableCell colSpan={6} className="h-40 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">No pending verifications</TableCell></TableRow>
                      ) : pendingTrades?.map((t) => (
                         <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <TableCell className="px-8 py-4 font-mono text-[10px] text-white/40">#{t.id.slice(-6).toUpperCase()}</TableCell>
                            <TableCell className="px-8 py-4">
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-white">{t.client_username}</span>
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Client Node</span>
                               </div>
                            </TableCell>
                            <TableCell className="px-8 py-4 font-black text-white text-xs italic">{t.crypto_amount} {t.crypto_asset_id}</TableCell>
                            <TableCell className="px-8 py-4 font-black text-primary text-xs italic">₹{t.fiat_amount.toLocaleString()}</TableCell>
                            <TableCell className="px-8 py-4">
                               <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 rounded-full ${t.status === 'Paid' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>{t.status}</Badge>
                            </TableCell>
                            <TableCell className="px-8 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <Button onClick={() => handleApproveTrade(t)} size="sm" className="bg-green-500 hover:bg-green-600 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest text-white">Approve</Button>
                                  <Button onClick={() => handleTradeStatusUpdate(t, "Hold")} variant="outline" size="sm" className="h-9 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white">Hold</Button>
                               </div>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
           </Card>
         ) : activeTab === "settlements" ? (
           <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                   <CreditCard className="w-4 h-4 text-primary" /> Payout Requests
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                   <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Identity</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Method</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Value</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Status</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {allWithdrawals?.filter(w => w.status !== "Success").length === 0 ? (
                         <TableRow><TableCell colSpan={5} className="h-40 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">No pending payouts</TableCell></TableRow>
                      ) : allWithdrawals?.filter(w => w.status !== "Success").map((w) => (
                         <TableRow key={w.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <TableCell className="px-8 py-4">
                               <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-white">{w.username}</span>
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">{w.id.slice(-8).toUpperCase()}</span>
                               </div>
                            </TableCell>
                            <TableCell className="px-8 py-4">
                               <div className="flex flex-col">
                                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{w.gateway_details?.type}</span>
                                  <span className="text-[9px] font-mono text-white/40">{w.gateway_details?.detail}</span>
                               </div>
                            </TableCell>
                            <TableCell className="px-8 py-4 font-black text-white text-xs italic">₹{w.amount.toLocaleString()}</TableCell>
                            <TableCell className="px-8 py-4">
                               <Badge variant="outline" className={`text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 rounded-full ${w.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>{w.status}</Badge>
                            </TableCell>
                            <TableCell className="px-8 py-4 text-right">
                               <div className="flex items-center justify-end gap-2">
                                  <Button onClick={() => handleWithdrawalAction(w, "Success")} size="sm" className="bg-primary glow-primary h-9 rounded-xl text-[9px] font-black uppercase tracking-widest text-white">Mark Paid</Button>
                                  <Button onClick={() => handleWithdrawalAction(w, "Hold")} variant="outline" size="sm" className="h-9 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white">Flag</Button>
                               </div>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
           </Card>
         ) : activeTab === "agents" ? (
           <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                   <Users className="w-4 h-4 text-primary" /> Managed Agents
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                   <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Agent Identity</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Referral Code</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Status</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Provisioned On</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {myAgents?.length === 0 ? (
                         <TableRow><TableCell colSpan={4} className="h-40 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">No agents provisioned</TableCell></TableRow>
                      ) : myAgents?.map((a) => (
                         <TableRow key={a.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <TableCell className="px-8 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10"><UserCircle className="w-5 h-5 text-white/40" /></div>
                                  <div className="flex flex-col">
                                     <span className="text-[11px] font-black uppercase tracking-widest text-white">{a.username}</span>
                                     <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">{a.email}</span>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell className="px-8 py-4 text-center font-mono text-[10px] text-primary font-black tracking-widest">{a.referral_code}</TableCell>
                            <TableCell className="px-8 py-4 text-center">
                               <div className="flex items-center justify-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${a.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`} />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{a.is_active ? 'Active' : 'Locked'}</span>
                               </div>
                            </TableCell>
                            <TableCell className="px-8 py-4 text-right text-[9px] font-bold uppercase tracking-widest text-white/20">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
           </Card>
         ) : activeTab === "history" ? (
           <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
             <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                   <HistoryIcon className="w-4 h-4 text-primary" /> Institutional Ledger
                </CardTitle>
             </CardHeader>
             <CardContent className="p-0">
                <Table>
                   <TableHeader className="bg-white/[0.02]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Reference</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Client</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Volume</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Settlement</TableHead>
                         <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Timestamp</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {successTrades?.length === 0 ? (
                         <TableRow><TableCell colSpan={5} className="h-40 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">No successful trades recorded</TableCell></TableRow>
                      ) : successTrades?.map((t) => (
                         <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                            <TableCell className="px-8 py-4 font-mono text-[10px] text-white/40">#{t.id.slice(-6).toUpperCase()}</TableCell>
                            <TableCell className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white">{t.client_username}</TableCell>
                            <TableCell className="px-8 py-4 font-black text-white text-xs italic">{t.crypto_amount} {t.crypto_asset_id}</TableCell>
                            <TableCell className="px-8 py-4 font-black text-green-500 text-xs italic">₹{t.fiat_amount.toLocaleString()}</TableCell>
                            <TableCell className="px-8 py-4 text-right text-[9px] font-bold uppercase tracking-widest text-white/20">{new Date(t.initiation_time).toLocaleString()}</TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
           </Card>
         ) : activeTab === "settings" ? (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in-scale">
             <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-8">
               <div className="space-y-1">
                 <h3 className="text-xl font-headline font-black uppercase tracking-tight text-white italic">Node Identity</h3>
                 <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Institutional Profile Protocol</p>
               </div>
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="space-y-3">
                   <Label className="text-hierarchy-label ml-2">Display Name</Label>
                   <Input name="fullName" defaultValue={userData?.full_name} placeholder="Full Authority Name" className="bg-white/5 border-white/10 h-14 rounded-xl text-white px-6 focus:ring-primary/50 font-bold" />
                 </div>
                 <div className="space-y-3">
                   <Label className="text-hierarchy-label ml-2">Node Alias</Label>
                   <Input name="username" defaultValue={userData?.username} placeholder="@username" className="bg-white/5 border-white/10 h-14 rounded-xl text-white px-6 focus:ring-primary/50 font-bold" />
                 </div>
                 <Button type="submit" className="w-full h-14 bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">Update Identity</Button>
               </form>
             </Card>

             <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-8">
               <div className="space-y-1">
                 <h3 className="text-xl font-headline font-black uppercase tracking-tight text-white italic">Asset Endpoints</h3>
                 <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Institutional Wallet Configuration</p>
               </div>
               <form onSubmit={handleUpdateWallets} className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-2">TRC20 Address</Label>
                      <Input name="trc20" defaultValue={userData?.wallet_address_trc20} placeholder="T..." className="bg-white/5 border-white/10 h-14 rounded-xl text-[10px] font-mono" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-2">TRC20 QR (CID)</Label>
                      <Input name="trc20Qr" defaultValue={userData?.wallet_qr_trc20} placeholder="bafy..." className="bg-white/5 border-white/10 h-14 rounded-xl text-[10px] font-mono" />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-2">BEP20 Address</Label>
                      <Input name="bep20" defaultValue={userData?.wallet_address_bep20} placeholder="0x..." className="bg-white/5 border-white/10 h-14 rounded-xl text-[10px] font-mono" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-2">BEP20 QR (CID)</Label>
                      <Input name="bep20Qr" defaultValue={userData?.wallet_qr_bep20} placeholder="bafy..." className="bg-white/5 border-white/10 h-14 rounded-xl text-[10px] font-mono" />
                    </div>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-hierarchy-label ml-2">Agent Commission (%)</Label>
                   <div className="relative">
                    <Input name="commission" type="number" step="0.1" defaultValue={userData?.referral_commission || 0} className="bg-white/5 border-white/10 h-14 rounded-xl text-white px-6 font-bold" />
                    <Percent className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-white/20" />
                   </div>
                 </div>
                 <Button type="submit" className="w-full h-14 bg-primary rounded-xl font-black uppercase tracking-widest text-[10px] text-white glow-primary">Commit Endpoints</Button>
               </form>
             </Card>
           </div>
         ) : activeTab === "support" ? (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-in-scale">
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 hover:border-primary/20 transition-all group">
                 <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform"><Mail className="w-6 h-6 text-primary" /></div>
                 <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Email Protocol</h4>
                    <p className="text-[10px] text-white/40 font-bold tracking-widest">support@connectcrypto.com</p>
                 </div>
                 <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">Open Ticket</Button>
              </Card>
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 hover:border-primary/20 transition-all group">
                 <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform"><Send className="w-6 h-6 text-primary" /></div>
                 <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Telegram Node</h4>
                    <p className="text-[10px] text-white/40 font-bold tracking-widest">@ConnectCryptoSupport</p>
                 </div>
                 <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">Join Channel</Button>
              </Card>
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 hover:border-primary/20 transition-all group">
                 <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform"><Phone className="w-6 h-6 text-primary" /></div>
                 <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Voice Uplink</h4>
                    <p className="text-[10px] text-white/40 font-bold tracking-widest">+1 (800) CRYPTO-NODE</p>
                 </div>
                 <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">Request Call</Button>
              </Card>
           </div>
         ) : null}

      </div>
    </main>

        {/* Add/Edit Offer Dialog */}
        <Dialog open={isAddOfferOpen} onOpenChange={(open) => {
          setIsAddOfferOpen(open);
          if (!open) {
            setEditingOfferId(null);
            resetOfferForm();
          }
        }}>
          <DialogContent className="glass-card border-white/10 rounded-[2.5rem] p-8 max-w-lg">
            <DialogHeader><DialogTitle className="text-xl font-bold uppercase text-white">{editingOfferId ? "Edit Position" : "New Market Position"}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Crypto Asset</Label>
                  <Input value={offerCrypto} onChange={e => setOfferCrypto(e.target.value.toUpperCase())} placeholder="USDT" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Network</Label>
                   <Input value={offerNetwork} onChange={e => setOfferNetwork(e.target.value.toUpperCase())} placeholder="TRC20, BEP20..." className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Display Name</Label>
                <Input value={offerDisplayName} onChange={e => setOfferDisplayName(e.target.value)} placeholder="e.g. Fast USDT" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Fiat Currency</Label>
                  <Input value={offerFiat} onChange={e => setOfferFiat(e.target.value.toUpperCase())} placeholder="INR" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Fixed Rate</Label>
                  <Input type="number" step="0.01" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Asset Icon CID</Label>
                <div className="flex gap-2">
                  <Input value={offerIconCid} onChange={e => setOfferIconCid(e.target.value)} placeholder="IPFS CID" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50 flex-1" />
                  <IPFSPreview cid={offerIconCid} label="Icon" className="w-12 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Terms & Description</Label>
                <Textarea value={offerDescription} onChange={e => setOfferDescription(e.target.value)} placeholder="Trade terms..." className="bg-white/5 border-white/10 min-h-[100px] rounded-xl focus:ring-primary/50" />
              </div>
            </div>
            <DialogFooter><Button onClick={handleOpenPosition} className="w-full h-14 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary">Confirm & Publish</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Provision Agent Dialog */}
        <Dialog open={isAgentProvisionOpen} onOpenChange={setIsAgentProvisionOpen}>
          <DialogContent className="glass-card border-none rounded-[2.5rem] p-10 max-w-lg">
            <DialogHeader className="space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-tighter">Provision Agent</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Assign a new sub-node to your protocol.</p>
              </div>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Agent Email</Label>
                <Input value={newAgentEmail} onChange={e => setNewAgentEmail(e.target.value)} placeholder="agent@example.com" className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Agent Alias</Label>
                  <span onClick={generateAgentUsername} className="text-[9px] text-primary cursor-pointer hover:underline font-bold uppercase tracking-wider">Generate</span>
                </div>
                <Input value={newAgentUsername} onChange={e => setNewAgentUsername(e.target.value)} placeholder="agent_007" className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Access Phrase</Label>
                <Input value={newAgentPass} onChange={e => setNewAgentPass(e.target.value)} placeholder="agent123" className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleProvisionAgent} className="w-full h-14 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary hover:scale-[1.01] transition-all" disabled={isProvisioningAgent}>
                {isProvisioningAgent ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Provision"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
  </div>
  );
}
