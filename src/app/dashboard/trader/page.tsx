"use client";

import { cn } from "@/lib/utils";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  Plus, 
  Loader2, 
  Settings, 
  UserCircle, 
  Image as ImageIcon,
  ShieldCheck,
  Zap,
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
  Trash2,
  Percent
} from "lucide-react";
import { useSupabaseAuth } from "@/lib/supabase-auth-provider";
import { useSupabaseQuery, useSupabaseDoc } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { TradeTransaction, WithdrawalRequest, TraderOffer, Profile, GlobalSettings } from "@/types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { NavItem } from "@/components/dashboard/AppSidebar";

export default function TraderDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isUserLoading, signOut } = useSupabaseAuth();

  const { data: userData, loading: isUserDataLoading, error: userDataError } = useSupabaseDoc<Profile>("profiles", user?.id);

  const [activeTab, setActiveTab] = useState("offers");
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

  const navItems: NavItem[] = [
    { id: "queue", label: "Verification", icon: Zap },
    { id: "settlements", label: "Payouts", icon: CreditCard },
    { id: "offers", label: "Positions", icon: LayoutDashboard },
    { id: "agents", label: "Agents", icon: Users },
    { id: "history", label: "Ledger", icon: HistoryIcon },
    { id: "support", label: "Support", icon: Headset },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "trust", label: "Trust", icon: ShieldCheck }
  ];

  useEffect(() => {
    if (userDataError) {
      console.error("Error loading trader profile:", userDataError);
      if (user) {
        toast({ 
          variant: "destructive", 
          title: "Profile Error", 
          description: "Could not load your profile. Please try logging in again." 
        });
      }
    }
  }, [userDataError, user, toast]);

  console.log("Dashboard State:", { user, userData, isUserLoading, isUserDataLoading, userDataError });

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

  const { data: allWithdrawals } = useSupabaseQuery<WithdrawalRequest>("withdrawals", {
    eq: ["trader_id", user?.id],
    order: ["created_at", { ascending: false }],
    limit: 100
  });

  const { data: myAgents } = useSupabaseQuery<Profile>("profiles", {
    eq: ["trader_id", user?.id],
    limit: 50
  });

  const { data: globalSettings } = useSupabaseDoc<GlobalSettings>("global_settings", "default");
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
    } catch (e: unknown) {
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

  const handleDeleteOffer = async (id: string) => {
    try {
      const { error } = await supabase.from("trader_buy_offers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Position Purged", description: "Offer removed from the market." });
    } catch (e: unknown) {
      toast({ variant: "destructive", title: "Purge Failed", description: e.message });
    }
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
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Protocol Error", description: typeof e === 'string' ? e : "Failed to release funds." });
    }
  };

  const handleTradeStatusUpdate = async (trade: TradeTransaction, newStatus: string) => {
    try {
      const { error } = await supabase.from("trade_transactions").update({ status: newStatus }).eq("id", trade.id);
      if (!error) toast({ title: "Status Updated", description: `Trade status changed to ${newStatus}.` });
    } catch (e: any) {
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
    } catch (e: any) {
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



  return (
    <DashboardLayout
      navItems={navItems}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedLogo={brandingSettings?.selectedLogo || "original"}
      onLogout={() => setIsSignOutDialogOpen(true)}
      title={userData?.username || "Trader Node"}
      subtitle="Verified Authority"
    >
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
              await signOut(); 
              router.replace("/auth/login"); 
            }} className="bg-red-500 hover:bg-red-600 rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest text-white glow-primary transition-all">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <p className="text-primary text-[10px] uppercase tracking-[0.4em] font-black mb-1">Welcome Back, Authority @{userData?.username || 'Verified'}</p>
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase leading-none tracking-tighter italic">Institutional Feed</h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <p className="text-green-500 text-[9px] uppercase tracking-[0.3em] font-black">Node Active</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {activeTab === "offers" && (
              <Button onClick={() => setIsAddOfferOpen(true)} className="bg-primary glow-primary h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:scale-[1.02] transition-transform">
                <Plus className="w-5 h-5 mr-3" /> Open New Position
              </Button>
            )}
            {activeTab === "agents" && (
              <Button onClick={() => setIsAgentProvisionOpen(true)} className="bg-primary glow-primary h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:scale-[1.02] transition-transform">
                <Plus className="w-5 h-5 mr-3" /> Provision Sub-Node
              </Button>
            )}
          </div>
        </div>

        {activeTab === "offers" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card border-none rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-white/[0.04] transition-all">
              <div className="w-16 h-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                <Coins className="w-8 h-8 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-hierarchy-label mb-1">USDT Volume Received</span>
                <span className="text-3xl font-black font-headline text-white tracking-tight italic">
                  {totalCryptoReceived.toLocaleString()} <span className="text-xs not-italic text-white/20 ml-1">USDT</span>
                </span>
              </div>
            </Card>
            <Card className="glass-card border-none rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-white/[0.04] transition-all">
              <div className="w-16 h-16 bg-green-500/10 rounded-[1.5rem] flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                <CreditCard className="w-8 h-8 text-green-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-hierarchy-label mb-1">Institutional Payouts</span>
                <span className="text-3xl font-black font-headline text-white tracking-tight italic">₹{totalMoneyPaid.toLocaleString()}</span>
              </div>
            </Card>
            <Card className="glass-card border-none rounded-[2.5rem] p-8 flex items-center gap-6 group hover:bg-white/[0.04] transition-all">
              <div className="w-16 h-16 bg-amber-500/10 rounded-[1.5rem] flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-hierarchy-label mb-1">Settlement Pending</span>
                <span className="text-3xl font-black font-headline text-white tracking-tight italic">₹{totalMoneyToPay.toLocaleString()}</span>
              </div>
            </Card>
          </div>
        )}

        <div className="w-full">
          {activeTab === "offers" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5 gap-6 animate-in-scale">
              {myOffers?.map(off => (
                <Card key={off.id} className="glass-card border-none rounded-[2rem] p-6 flex flex-col min-h-[240px] justify-between space-y-6 hover:border-primary/40 transition-all duration-700 group/card relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/card:bg-primary/10 transition-all duration-700" />
                  <div className="space-y-6 relative z-10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {off.icon_cid || off.crypto_asset_id?.toUpperCase().includes("USDT") ? (
                          <div className={cn("relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 group-hover/card:scale-110 transition-transform duration-500", !off.crypto_asset_id?.toUpperCase().includes("USDT") && "border border-white/10 bg-white/5 shadow-2xl")}>
                            <Image 
                              src={`https://ipfs.io/ipfs/${off.crypto_asset_id?.toUpperCase().includes("USDT") ? "bafybeicygbg5kw4b5wyzx7rsv7zen5qmgda6jkn57phoqhp67jji7fpefa" : off.icon_cid}`} 
                              alt={off.crypto_asset_id} 
                              fill 
                              className="object-cover opacity-80 group-hover/card:opacity-100 transition-opacity" 
                              unoptimized 
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-6 h-6 text-muted-foreground opacity-20" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1 gap-1">
                          <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] truncate opacity-80">
                            {off.display_name}
                          </p>
                          <p className="font-headline font-black text-xl uppercase tracking-tighter text-white group-hover/card:text-primary transition-colors truncate italic">
                            {off.crypto_asset_id}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-2 group-hover/card:translate-x-0">
                         <Button variant="ghost" size="icon" onClick={() => handleEditOffer(off)} className="h-9 w-9 rounded-xl text-white/40 hover:text-primary hover:bg-primary/10 border border-white/5 transition-all"><Edit2 className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDuplicateOffer(off)} className="h-9 w-9 rounded-xl text-white/40 hover:text-primary hover:bg-primary/10 border border-white/5 transition-all"><CopyIcon className="w-4 h-4" /></Button>
                         <Button variant="ghost" size="icon" onClick={() => handleDeleteOffer(off.id)} className="h-9 w-9 rounded-xl text-white/40 hover:text-red-500 hover:bg-red-500/10 border border-white/5 transition-all"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    {off.description && (
                      <div className="px-3 border-l-2 border-primary/20 ml-1">
                        <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed italic font-bold uppercase tracking-wider">
                          &quot;{off.description}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-6 border-t border-white/[0.05] flex justify-between items-end relative z-10">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-hierarchy-label tracking-[0.2em]">Market Rate</span>
                      <p className="text-2xl font-headline font-black text-white leading-none italic group-hover/card:text-primary transition-colors tracking-tighter">{off.fixed_price_per_crypto} <span className="text-[10px] opacity-40 not-italic font-bold ml-1">{off.fiat_currency}</span></p>
                    </div>
                    <Badge variant="outline" className="text-[9px] py-1.5 px-4 border-green-500/20 text-green-500 uppercase font-black tracking-widest bg-green-500/10 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                      {off.status}
                    </Badge>
                  </div>
                </Card>
              ))}
              <Button onClick={() => setIsAddOfferOpen(true)} variant="ghost" className="border-2 border-dashed border-white/10 rounded-[2rem] min-h-[240px] w-full flex flex-col items-center justify-center gap-5 hover:border-primary/40 hover:bg-primary/5 transition-all group duration-500 shadow-2xl">
                 <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all duration-500 shadow-xl">
                   <Plus className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white transition-colors">Open New Position</span>
              </Button>
            </div>
          ) : activeTab === "queue" ? (
             <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
               <CardHeader className="p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shrink-0">
                      <Zap className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-black uppercase tracking-tight">Verification Queue</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60 mt-1">Institutional Trade Authentication</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-2 px-6 font-black uppercase border-white/10 text-muted-foreground rounded-full bg-white/5 tracking-[0.2em]">Priority Action</Badge>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto no-scrollbar">
                  <Table>
                     <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/[0.05] hover:bg-transparent h-20">
                           <TableHead className="px-12 text-hierarchy-label">Reference</TableHead>
                           <TableHead className="text-hierarchy-label">Client Identity</TableHead>
                           <TableHead className="text-hierarchy-label">Asset Volume</TableHead>
                           <TableHead className="text-hierarchy-label">Fiat Settlement</TableHead>
                           <TableHead className="text-hierarchy-label">Status</TableHead>
                           <TableHead className="px-12 text-right text-hierarchy-label">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {pendingTrades?.length === 0 ? (
                           <TableRow><TableCell colSpan={6} className="h-80 text-center text-[11px] font-black uppercase tracking-[0.4em] text-white/10 italic">No pending verifications detected</TableCell></TableRow>
                        ) : pendingTrades?.map((t) => (
                           <TableRow key={t.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-24">
                              <TableCell className="px-12 font-mono text-[10px] text-white/20 group-hover:text-white/60 transition-colors">
                                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 tracking-wider">#{t.id.slice(-8).toUpperCase()}</span>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[12px] font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors italic">{t.client_username}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Client Participant</span>
                                 </div>
                              </TableCell>
                              <TableCell className="font-black text-white text-sm italic">{t.crypto_amount} {t.crypto_asset_id}</TableCell>
                              <TableCell className="font-black text-primary text-base italic group-hover:scale-110 transition-transform origin-left">₹{t.fiat_amount.toLocaleString()}</TableCell>
                              <TableCell>
                                 <Badge className={cn("px-4 py-1.5 text-[9px] font-black uppercase rounded-full border-none transition-all shadow-lg", t.status === 'Paid' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/5' : 'bg-primary/10 text-primary shadow-primary/5')}>{t.status}</Badge>
                              </TableCell>
                              <TableCell className="px-12 text-right">
                                 <div className="flex items-center justify-end gap-3">
                                    <Button onClick={() => handleApproveTrade(t)} className="bg-green-500 hover:bg-green-600 h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-green-500/10 transition-all hover:scale-105 active:scale-95">Verify & Release</Button>
                                    <Button onClick={() => handleTradeStatusUpdate(t, "Hold")} variant="outline" className="h-11 px-6 rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Flag Node</Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
             </Card>
          ) : activeTab === "settlements" ? (
             <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
               <CardHeader className="p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shrink-0">
                      <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-black uppercase tracking-tight">Payout Management</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60 mt-1">Capital Outflow Control Hub</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-2 px-6 font-black uppercase border-white/10 text-muted-foreground rounded-full bg-white/5 tracking-[0.2em]">Institutional Payouts</Badge>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto no-scrollbar">
                  <Table>
                     <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/[0.05] hover:bg-transparent h-20">
                           <TableHead className="px-12 text-hierarchy-label">Identity</TableHead>
                           <TableHead className="text-hierarchy-label">Payment Endpoint</TableHead>
                           <TableHead className="text-hierarchy-label">Settlement Value</TableHead>
                           <TableHead className="text-hierarchy-label">Status</TableHead>
                           <TableHead className="px-12 text-right text-hierarchy-label">Actions</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {allWithdrawals?.filter(w => w.status !== "Success").length === 0 ? (
                           <TableRow><TableCell colSpan={5} className="h-80 text-center text-[11px] font-black uppercase tracking-[0.4em] text-white/10 italic">No pending payout requests detected</TableCell></TableRow>
                        ) : allWithdrawals?.filter(w => w.status !== "Success").map((w) => (
                           <TableRow key={w.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-24">
                              <TableCell className="px-12">
                                 <div className="flex flex-col gap-1">
                                    <span className="text-[12px] font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors italic">{w.username}</span>
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">Ref: #{w.id.slice(-8).toUpperCase()}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col gap-1.5">
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] italic">{w.gateway_details?.type} • {w.gateway_details?.name}</span>
                                    <span className="text-[10px] font-mono text-primary/40 bg-primary/5 px-2 py-1 rounded-md border border-primary/10 w-fit">{w.gateway_details?.detail}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="font-black text-white text-base italic group-hover:scale-110 transition-transform origin-left">₹{w.amount.toLocaleString()}</TableCell>
                              <TableCell>
                                 <Badge className={cn("px-4 py-1.5 text-[9px] font-black uppercase rounded-full border-none transition-all shadow-lg", w.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/5' : 'bg-primary/10 text-primary shadow-primary/5')}>{w.status}</Badge>
                              </TableCell>
                              <TableCell className="px-12 text-right">
                                 <div className="flex items-center justify-end gap-3">
                                    <Button onClick={() => handleWithdrawalAction(w, "Success")} className="bg-primary glow-primary h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95">Commit Payout</Button>
                                    <Button onClick={() => handleWithdrawalAction(w, "Hold")} variant="outline" className="h-11 px-6 rounded-xl border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">Flag Node</Button>
                                 </div>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
             </Card>
          ) : activeTab === "agents" ? (
             <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
               <CardHeader className="p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shrink-0">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-black uppercase tracking-tight">Managed Sub-Nodes</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60 mt-1">Authorized Protocol Agents</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-2 px-6 font-black uppercase border-white/10 text-muted-foreground rounded-full bg-white/5 tracking-[0.2em]">Agent Network</Badge>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto no-scrollbar">
                  <Table>
                     <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/[0.05] hover:bg-transparent h-20">
                           <TableHead className="px-12 text-hierarchy-label">Agent Identity</TableHead>
                           <TableHead className="text-hierarchy-label text-center">Referral Protocol</TableHead>
                           <TableHead className="text-hierarchy-label text-center">Node Status</TableHead>
                           <TableHead className="px-12 text-right text-hierarchy-label">Provisioned On</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {myAgents?.length === 0 ? (
                           <TableRow><TableCell colSpan={4} className="h-80 text-center text-[11px] font-black uppercase tracking-[0.4em] text-white/10 italic">No sub-nodes provisioned</TableCell></TableRow>
                        ) : myAgents?.map((a) => (
                           <TableRow key={a.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-24">
                              <TableCell className="px-12">
                                 <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-[1.2rem] bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500 shadow-xl"><UserCircle className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" /></div>
                                    <div className="flex flex-col gap-1">
                                       <span className="text-[12px] font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors italic">{a.username}</span>
                                       <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">{a.email}</span>
                                    </div>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="font-mono text-[11px] text-primary font-black tracking-[0.2em] bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10 shadow-lg">{a.referral_code}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                 <div className="flex items-center justify-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]", a.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500')} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white/60 transition-colors">{a.is_active ? 'Active Node' : 'Locked'}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="px-12 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">
                                {new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
             </Card>
          ) : activeTab === "history" ? (
             <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
               <CardHeader className="p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shrink-0">
                      <HistoryIcon className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-headline font-black uppercase tracking-tight">Institutional Ledger</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-60 mt-1">Full Transaction History Protocol</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-2 px-6 font-black uppercase border-white/10 text-muted-foreground rounded-full bg-white/5 tracking-[0.2em]">Verified Archive</Badge>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto no-scrollbar">
                  <Table>
                     <TableHeader className="bg-white/[0.02]">
                        <TableRow className="border-white/[0.05] hover:bg-transparent h-20">
                           <TableHead className="px-12 text-hierarchy-label">Reference</TableHead>
                           <TableHead className="text-hierarchy-label">Client Identity</TableHead>
                           <TableHead className="text-hierarchy-label">Asset Volume</TableHead>
                           <TableHead className="text-hierarchy-label">Settlement Value</TableHead>
                           <TableHead className="px-12 text-right text-hierarchy-label">Timestamp</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {successTrades?.length === 0 ? (
                           <TableRow><TableCell colSpan={5} className="h-80 text-center text-[11px] font-black uppercase tracking-[0.4em] text-white/10 italic">No historical records found</TableCell></TableRow>
                        ) : successTrades?.map((t) => (
                           <TableRow key={t.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-24">
                              <TableCell className="px-12 font-mono text-[10px] text-white/20 group-hover:text-white/60 transition-colors">
                                <span className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 tracking-wider">#{t.id.slice(-8).toUpperCase()}</span>
                              </TableCell>
                              <TableCell className="text-[12px] font-black uppercase tracking-tight text-white group-hover:text-primary transition-colors italic">{t.client_username}</TableCell>
                              <TableCell className="font-black text-white text-sm italic">{t.crypto_amount} {t.crypto_asset_id}</TableCell>
                              <TableCell className="font-black text-green-500 text-base italic group-hover:scale-110 transition-transform origin-left">₹{t.fiat_amount.toLocaleString()}</TableCell>
                              <TableCell className="px-12 text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/20 group-hover:text-white/40 transition-colors">
                                {new Date(t.initiation_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).toUpperCase()}
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
             </Card>
          ) : activeTab === "settings" ? (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in-scale">
               <Card className="glass-card border-none rounded-[3.5rem] p-10 space-y-10 group overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                 <div className="space-y-2 relative z-10">
                   <h3 className="text-2xl font-headline font-black uppercase tracking-tight text-white italic">Node Identity</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Institutional Profile Protocol</p>
                 </div>
                 <form onSubmit={handleUpdateProfile} className="space-y-8 relative z-10">
                   <div className="space-y-4">
                     <Label className="text-hierarchy-label ml-2">Authority Display Name</Label>
                     <Input name="fullName" defaultValue={userData?.full_name} placeholder="Full Authority Name" className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-white px-8 focus:ring-primary/50 font-black uppercase tracking-wider text-xs" />
                   </div>
                   <div className="space-y-4">
                     <Label className="text-hierarchy-label ml-2">Node Access Alias</Label>
                     <Input name="username" defaultValue={userData?.username} placeholder="@username" className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-white px-8 focus:ring-primary/50 font-black italic text-xs" />
                   </div>
                   <Button type="submit" className="w-full h-16 bg-white/5 border border-white/10 rounded-[1.2rem] font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-95">Update Identity Protocol</Button>
                 </form>
               </Card>

               <Card className="glass-card border-none rounded-[3.5rem] p-10 space-y-10 group overflow-hidden relative">
                 <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                 <div className="space-y-2 relative z-10">
                   <h3 className="text-2xl font-headline font-black uppercase tracking-tight text-white italic">Asset Endpoints</h3>
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Institutional Wallet Configuration</p>
                 </div>
                 <form onSubmit={handleUpdateWallets} className="space-y-8 relative z-10">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-hierarchy-label ml-2">TRC20 Endpoint</Label>
                        <Input name="trc20" defaultValue={userData?.wallet_address_trc20} placeholder="T..." className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-[11px] font-mono px-6" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-hierarchy-label ml-2">TRC20 QR (CID)</Label>
                        <Input name="trc20Qr" defaultValue={userData?.wallet_qr_trc20} placeholder="bafy..." className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-[11px] font-mono px-6" />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-hierarchy-label ml-2">BEP20 Endpoint</Label>
                        <Input name="bep20" defaultValue={userData?.wallet_address_bep20} placeholder="0x..." className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-[11px] font-mono px-6" />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-hierarchy-label ml-2">BEP20 QR (CID)</Label>
                        <Input name="bep20Qr" defaultValue={userData?.wallet_qr_bep20} placeholder="bafy..." className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-[11px] font-mono px-6" />
                      </div>
                   </div>
                   <div className="space-y-4">
                     <Label className="text-hierarchy-label ml-2">Sub-Node Commission Protocol (%)</Label>
                     <div className="relative">
                      <Input name="commission" type="number" step="0.1" defaultValue={userData?.referral_commission || 0} className="bg-white/5 border-white/10 h-16 rounded-[1.2rem] text-white px-8 font-black text-xs" />
                      <Percent className="w-5 h-5 absolute right-8 top-1/2 -translate-y-1/2 text-primary/40" />
                     </div>
                   </div>
                   <Button type="submit" className="w-full h-16 bg-primary rounded-[1.2rem] font-black uppercase tracking-[0.4em] text-[10px] text-white glow-primary transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary/20">Commit Institutional Endpoints</Button>
                 </form>
               </Card>
             </div>
          ) : activeTab === "support" ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 animate-in-scale">
                <Card className="glass-card border-none rounded-[3.5rem] p-12 space-y-8 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform shadow-2xl"><Mail className="w-8 h-8 text-primary" /></div>
                   <div className="space-y-3 relative z-10">
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">Email Protocol</h4>
                      <p className="text-[11px] text-white/40 font-bold tracking-widest break-all">support@connectcrypto.com</p>
                   </div>
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:bg-white/10 transition-all">Initiate Uplink</Button>
                </Card>
                <Card className="glass-card border-none rounded-[3.5rem] p-12 space-y-8 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform shadow-2xl"><Send className="w-8 h-8 text-primary" /></div>
                   <div className="space-y-3 relative z-10">
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">Telegram Node</h4>
                      <p className="text-[11px] text-white/40 font-bold tracking-widest">@ConnectCryptoSupport</p>
                   </div>
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:bg-white/10 transition-all">Join Authority Channel</Button>
                </Card>
                <Card className="glass-card border-none rounded-[3.5rem] p-12 space-y-8 hover:bg-white/[0.04] transition-all group relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform shadow-2xl"><Phone className="w-8 h-8 text-primary" /></div>
                   <div className="space-y-3 relative z-10">
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">Voice Link</h4>
                      <p className="text-[11px] text-white/40 font-bold tracking-widest">+1 (800) CRYPTO-NODE</p>
                   </div>
                   <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white hover:bg-white/10 transition-all">Request Priority Link</Button>
                </Card>
             </div>
          ) : activeTab === "trust" ? (
             <div className="max-w-4xl mx-auto space-y-12 animate-in-scale py-10">
                <div className="text-center space-y-6">
                   <div className="w-24 h-24 bg-primary/10 rounded-[3rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl animate-pulse">
                      <ShieldCheck className="w-12 h-12 text-primary" />
                   </div>
                   <div className="space-y-2">
                      <h2 className="text-4xl font-headline font-black uppercase tracking-tighter text-white italic">Trust Protocol</h2>
                      <p className="text-primary text-[11px] uppercase tracking-[0.6em] font-black opacity-80">Network Authority Verification</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <Card className="glass-card border-none rounded-[3rem] p-10 space-y-6 hover:bg-white/[0.03] transition-all">
                      <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20"><ShieldCheck className="w-7 h-7 text-green-500" /></div>
                      <div className="space-y-3">
                         <h4 className="text-lg font-black uppercase tracking-tight text-white italic">Identity Verified</h4>
                         <p className="text-[11px] text-white/30 leading-relaxed font-bold uppercase tracking-wider">Your node identity has been successfully cross-referenced with the global ledger. All administrative privileges are active.</p>
                      </div>
                   </Card>
                   <Card className="glass-card border-none rounded-[3rem] p-10 space-y-6 hover:bg-white/[0.03] transition-all">
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20"><Zap className="w-7 h-7 text-primary" /></div>
                      <div className="space-y-3">
                         <h4 className="text-lg font-black uppercase tracking-tight text-white italic">Node Priority</h4>
                         <p className="text-[11px] text-white/30 leading-relaxed font-bold uppercase tracking-wider">Your node is currently operating with high-priority status. Verification requests will be routed to you instantly for settlement.</p>
                      </div>
                   </Card>
                </div>

                <div className="bg-primary/5 border border-primary/10 rounded-[3rem] p-10 flex items-start gap-8 shadow-2xl">
                   <Clock className="w-10 h-10 text-primary shrink-0 mt-1" />
                   <div className="space-y-4">
                      <h4 className="text-sm font-black uppercase tracking-[0.3em] text-white italic">Uptime Protocol</h4>
                      <p className="text-[11px] text-white/30 leading-relaxed font-bold uppercase tracking-[0.2em]">Maintain high availability to ensure market liquidity. Nodes with higher uptime protocols receive preferential routing for institutional trades.</p>
                   </div>
                </div>
             </div>
          ) : null}
        </div>

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
    </DashboardLayout>
  );
}









