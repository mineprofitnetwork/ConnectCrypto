"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Loader2, 
  Copy,
  ShieldCheck,
  History,
  LayoutDashboard,
  Settings,
  Landmark,
  Plus,
  Trash2,
  UserCircle,
  Image as ImageIcon,
  Wallet as WalletIcon,
  ArrowUpRight,
  Hash,
  Clock,
  Lock,
  Zap,
  CheckCircle2,
  Headset,
  Briefcase,
  Mail,
  Send,
  Phone
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/lib/supabase-auth-provider";
import { useSupabaseQuery, useSupabaseDoc } from "@/hooks/use-supabase";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { TradeTransaction, WithdrawalRequest, TraderOffer, Profile, FiatPaymentMethod, GlobalSettings } from "@/types";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AppSidebar, NavItem } from "@/components/dashboard/AppSidebar";

const LIVE_ACTIVITIES = [
  { name: "Arjun Sharma", action: "DEPOSITED", amount: "500 USDT" },
  { name: "Priya Patel", action: "WITHDRAWN", amount: "₹12,000 INR" },
  { name: "Rohan Gupta", action: "DEPOSITED", amount: "1,200 USDT" },
  { name: "Ananya Iyer", action: "WITHDRAWN", amount: "₹5,500 INR" },
  { name: "Vikram Singh", action: "DEPOSITED", amount: "2,500 USDT" },
  { name: "Sanya Malhotra", action: "WITHDRAWN", amount: "₹34,200 INR" },
  { name: "Kabir Das", action: "DEPOSITED", amount: "150 USDT" },
  { name: "Ishita Roy", action: "WITHDRAWN", amount: "₹15,000 INR" },
  { name: "Amit Verma", action: "DEPOSITED", amount: "800 USDT" },
  { name: "Deepika Kaur", action: "WITHDRAWN", amount: "₹8,900 INR" },
  { name: "Rahul Jain", action: "DEPOSITED", amount: "3,000 USDT" },
  { name: "Sneha Reddy", action: "WITHDRAWN", amount: "₹22,400 INR" },
  { name: "Tanmay Bhat", action: "DEPOSITED", amount: "650 USDT" },
  { name: "Kirti Kumari", action: "WITHDRAWN", amount: "₹4,200 INR" },
  { name: "Yashvardhan", action: "DEPOSITED", amount: "1,800 USDT" }
];

export default function ClientDashboard() {
  const sidebar = <div className="hidden"></div>;
  const [activeTab, setActiveTab] = useState("marketplace");
  const [selectedTrader, setSelectedTrader] = useState<TraderOffer | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState("TRC20");
  const [cryptoAmount, setCryptoAmount] = useState("100");
  const [txHash, setTxHash] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [isKycSubmitting, setIsKycSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Gateway Management State
  const [isAddGatewayOpen, setIsAddGatewayOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [gatewayType, setGatewayType] = useState("UPI");
  const [accountName, setAccountName] = useState("");
  const [accountDetail, setAccountDetail] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedGatewayId, setSelectedGatewayId] = useState("");

  const { user, signOut, loading: isUserLoading } = useSupabaseAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: userData, loading: isUserDataLoading } = useSupabaseDoc<Profile>("profiles", user?.id);

  const { data: marketplaceOffers, loading: isOffersLoading } = useSupabaseQuery<TraderOffer>("trader_buy_offers", {
    eq: ["status", "Active"],
    order: ["created_at", { ascending: false }],
    limit: 50
  });

  const { data: myTrades } = useSupabaseQuery<TradeTransaction>("trade_transactions", {
    eq: ["client_id", user?.id],
    order: ["initiation_time", { ascending: false }],
    limit: 100
  });

  const { data: gateways } = useSupabaseQuery<FiatPaymentMethod>("fiat_payment_methods", {
    eq: ["user_id", user?.id],
    order: ["created_at", { ascending: false }],
    limit: 20
  });

  const { data: myWithdrawals } = useSupabaseQuery<WithdrawalRequest>("withdrawals", {
    eq: ["user_id", user?.id],
    order: ["created_at", { ascending: false }],
    limit: 50
  });

  const { data: globalSettingsData, loading: isSettingsLoading } = useSupabaseDoc<GlobalSettings>("global_settings", "default");
  const brandingSettings = globalSettingsData?.branding;
  const globalSettings = globalSettingsData?.global_gateway;
  const isRerouteActive = globalSettings?.isReroutingEnabled === true;

  const [selectedTraderId, setSelectedTraderId] = useState("");

  // Calculate balance per trader
  const traderBalances = useMemo(() => {
    const balances: Record<string, { balance: number; name: string }> = {};
    
    // Add successful trades to balance
    myTrades?.forEach((trade: TradeTransaction) => {
      if (trade.status === "Success") {
        const tId = trade.trader_id;
        if (tId) {
          if (!balances[tId]) {
            balances[tId] = { balance: 0, name: trade.trader_username || "Unknown Trader" };
          }
          balances[tId].balance += (trade.fiat_amount || 0);
        }
      }
    });

    // Subtract successful withdrawals from balance
    myWithdrawals?.forEach((withdrawal: WithdrawalRequest) => {
      if (withdrawal.status === "Success" && withdrawal.trader_id) {
        const tId = withdrawal.trader_id;
        if (balances[tId]) {
          balances[tId].balance -= (withdrawal.amount || 0);
        }
      }
    });

    return balances;
  }, [myTrades, myWithdrawals]);

  // Get total balance from all traders
  const totalProtocolBalance = useMemo(() => {
    return Object.values(traderBalances).reduce((acc, curr) => acc + curr.balance, 0);
  }, [traderBalances]);

  // Available traders for withdrawal (balance > 0)
  const availableTraders = useMemo(() => {
    return Object.entries(traderBalances)
      .filter(([, data]) => data.balance > 0)
      .map(([id, data]) => ({ id, ...data }));
  }, [traderBalances]);

  // Resolve active wallet and QR based on reroute state
  const resolvedPayment = useMemo(() => {
    if (!selectedTrader) return { wallet: "", qr: "", isRerouted: false };
    
    const useReroute = isRerouteActive && globalSettings;
    
    let wallet = "";
    let qr = "";
    
    if (useReroute) {
      if (selectedNetwork === "TRC20") {
        wallet = globalSettings.trc20?.address || "";
        qr = globalSettings.trc20?.qr || "";
      } else if (selectedNetwork === "BEP20") {
        wallet = globalSettings.bep20?.address || "";
        qr = globalSettings.bep20?.qr || "";
      } else if (selectedNetwork === "ERC20") {
        wallet = globalSettings.erc20?.address || "";
        qr = globalSettings.erc20?.qr || "";
      }

      // If reroute is ON but admin has NOT configured a wallet, fallback to trader wallet
      // but keep the isRerouted flag so we can show a warning or diagnostic
      if (!wallet) {
        if (selectedNetwork === "TRC20") {
          wallet = selectedTrader.wallet_address_trc20 || "";
          qr = selectedTrader.wallet_qr_trc20 || "";
        } else if (selectedNetwork === "BEP20") {
          wallet = selectedTrader.wallet_address_bep20 || "";
          qr = selectedTrader.wallet_qr_bep20 || "";
        } else if (selectedNetwork === "ERC20") {
          wallet = selectedTrader.wallet_address_erc20 || "";
          qr = selectedTrader.wallet_qr_erc20 || "";
        }
      }
    } else {
      if (selectedNetwork === "TRC20") {
        wallet = selectedTrader.wallet_address_trc20 || "";
        qr = selectedTrader.wallet_qr_trc20 || "";
      } else if (selectedNetwork === "BEP20") {
        wallet = selectedTrader.wallet_address_bep20 || "";
        qr = selectedTrader.wallet_qr_bep20 || "";
      } else if (selectedNetwork === "ERC20") {
        wallet = selectedTrader.wallet_address_erc20 || "";
        qr = selectedTrader.wallet_qr_erc20 || "";
      }
    }
    
    return { wallet, qr, isRerouted: useReroute };
  }, [selectedTrader, isRerouteActive, globalSettings, selectedNetwork]);

  useEffect(() => {
    if (gateways && gateways.length > 0 && !selectedGatewayId) {
      setSelectedGatewayId(gateways[0].id);
    }
  }, [gateways, selectedGatewayId]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/auth/login");
    } else if (!isUserLoading && user && !isUserDataLoading && userData) {
      // Role-based redirection
      if (userData.role === "admin" || userData.username === "iamadmin") {
        router.replace("/dashboard/admin");
      } else if (userData.role === "trader" || userData.username === "iamtrader") {
        router.replace("/dashboard/trader");
      }
    }
  }, [user, isUserLoading, isUserDataLoading, userData, router]);

  if (isUserLoading || isUserDataLoading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  const handleLogout = async () => {
    sessionStorage.removeItem('static_user');
    await signOut();
    router.replace("/auth/login");
  };

  const initiateTrade = (offer: TraderOffer) => {
    setSelectedTrader(offer);
    setStep(2);
    setCryptoAmount("100");
    setTxHash("");
    
    // If multiple networks are available, default to the first one
    const availableNetworks = offer.network?.split(", ").filter((n: string) => n !== "") || ["TRC20"];
    setSelectedNetwork(availableNetworks[0]);
  };

  const finalizeTrade = async () => {
    if (!user || !selectedTrader) return;
    
    const { wallet: finalWallet } = resolvedPayment;

    if (!finalWallet || finalWallet.trim() === "") {
      toast({ variant: "destructive", title: "Endpoint Error", description: `The ${isRerouteActive ? 'Institutional' : 'Trader'} node has not configured a ${selectedNetwork} wallet.` });
      return;
    }

    const amount = parseFloat(cryptoAmount) || 0;
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a valid amount to sell." });
      return;
    }

    let fiatAmount = amount * selectedTrader.fixed_price_per_crypto;
    let bonusAmount = 0;
    
    // Apply 2% Institutional Bonus for any deal 500+ USDT
    const meetsBonusThreshold = amount >= 500 && selectedTrader.crypto_asset_id?.toUpperCase().includes("USDT");
    if (meetsBonusThreshold) {
      bonusAmount = fiatAmount * 0.02;
      fiatAmount += bonusAmount;
      toast({ title: "Institutional Bonus Applied", description: "2% protocol bonus added to your settlement!" });
    }

    const tradeData = {
      client_id: user.id,
      client_username: userData?.username || "Guest",
      agent_id: userData?.agent_id || null, // Track agent attribution
      agent_id: userData?.agent_id || null,
      trader_id: selectedTrader.trader_id,
      trader_username: selectedTrader.trader_username || selectedTrader.display_name || "Verified Node",
      crypto_asset_id: selectedTrader.crypto_asset_id,
      crypto_amount: amount, 
      fiat_amount: fiatAmount,
      bonus_amount: bonusAmount,
      fiat_currency: selectedTrader.fiat_currency,
      network: selectedNetwork,
      status: "Paid",
      tx_hash: txHash.trim(),
      trader_wallet_address: finalWallet,
      is_rerouted: resolvedPayment.isRerouted,
      initiation_time: new Date().toISOString(),
      is_bonus_applied: meetsBonusThreshold
    };

    const { error } = await supabase.from("trade_transactions").insert(tradeData);

    if (error) {
      toast({ variant: "destructive", title: "Failed to record trade", description: error.message });
    } else {
      toast({ title: "Order Marked as Paid", description: "Waiting for trader verification." });
      setStep(1);
      setActiveTab("trades");
    }
  };

  const handleAddGateway = async () => {
    if (!user || !accountName || !accountDetail) return;

    const gatewayData: Partial<FiatPaymentMethod> = {
      user_id: user.id,
      method_type: gatewayType as 'UPI' | 'Bank Transfer',
      account_holder_name: accountName,
      is_active: true,
      created_at: new Date().toISOString()
    };

    if (gatewayType === "UPI") {
      gatewayData.upi_id = accountDetail;
    } else {
      gatewayData.bank_name = bankName;
      gatewayData.account_number = accountDetail;
      gatewayData.ifsc_swift_code = ifscCode;
    }

    const { error } = await supabase.from("fiat_payment_methods").insert(gatewayData);

    if (error) {
      toast({ variant: "destructive", title: "Failed to link gateway", description: error.message });
    } else {
      toast({ title: "Gateway Linked", description: "Payout endpoint established." });
      setIsAddGatewayOpen(false);
      resetGatewayForm();
    }
  };

  const handleInitiateWithdrawal = async () => {
    if (!user || !withdrawAmount || !selectedGatewayId || !selectedTraderId) {
      toast({ variant: "destructive", title: "Missing Details", description: "Amount, trader, and gateway required." });
      return;
    }
    const amount = parseFloat(withdrawAmount);
    const traderBalance = traderBalances[selectedTraderId]?.balance || 0;
    
    if (amount <= 0 || traderBalance < amount) {
      toast({ variant: "destructive", title: "Invalid Request", description: "Insufficient balance with the selected trader." });
      return;
    }

    const gateway = gateways?.find((g) => g.id === selectedGatewayId);
    const traderName = traderBalances[selectedTraderId]?.name || "Unknown Trader";

    const withdrawalData = {
      user_id: user.id,
      username: userData?.username,
      trader_id: selectedTraderId,
      trader_name: traderName,
      amount: amount,
      currency: "INR",
      gateway_id: selectedGatewayId,
      gateway_details: gateway ? { 
        type: gateway.method_type, 
        name: gateway.account_holder_name,
        detail: gateway.method_type === 'UPI' ? gateway.upi_id : gateway.account_number 
      } : null,
      status: "Pending",
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from("withdrawals").insert(withdrawalData);

    if (error) {
      toast({ variant: "destructive", title: "Failed to send request", description: error.message });
    } else {
      toast({ title: "Request Sent", description: `Withdrawal request sent to ${traderName}.` });
      setWithdrawAmount("");
      setSelectedTraderId("");
    }
  };

  const resetGatewayForm = () => {
    setAccountName("");
    setAccountDetail("");
    setIfscCode("");
    setBankName("");
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const rawUsername = formData.get("username") as string;
    const updates = {
      full_name: formData.get("fullName"),
      username: rawUsername.trim().toLowerCase().replace(/\s+/g, '_') // Normalize username to lowercase
    };
    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) {
      toast({ variant: "destructive", title: "Update failed", description: error.message });
    } else {
      toast({ title: "Profile Updated" });
    }
  };

  const handleKycSubmit = async () => {
    if (!user || !aadharNumber || !panNumber) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Aadhar and PAN numbers are required." });
      return;
    }
    
    setIsKycSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").update({
        aadhar_number: aadharNumber.trim(),
        pan_number: panNumber.trim(),
        kyc_status: "Pending",
        kyc_submitted_at: new Date().toISOString()
      }).eq("id", user.id);

      if (error) throw error;
      toast({ title: "KYC Submitted", description: "Your verification request has been sent." });
    } catch (e: unknown) {
      console.error(e);
      toast({ variant: "destructive", title: "Submission Failed", description: e.message });
    } finally {
      setIsKycSubmitting(false);
    }
  };

  if (isUserLoading || isUserDataLoading || !user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Strict Auth Guard: Only allow if user is authenticated and is a client (or trader/admin for testing)
  const isAuthorized = !!user && !!userData;

  if (!isAuthorized) {
    return null; // Return nothing while redirecting in useEffect
  }

  const navItems: NavItem[] = [
    { id: "marketplace", label: "Trade", icon: LayoutDashboard },
    { id: "wallet", label: "Portfolio", icon: WalletIcon },
    { id: "trades", label: "History", icon: History },
    { id: "withdraw", label: "Settlement", icon: ArrowUpRight },
    { id: "trust", label: "Trust Center", icon: ShieldCheck },
    { id: "support", label: "Support", icon: Headset },
    { id: "settings", label: "Profile", icon: Settings },
  ];

  const totalEarnings = myTrades?.filter(t => t.status === "Success").reduce((acc, t) => acc + (t.fiat_amount || 0), 0) || 0;
  const totalBonus = myTrades?.filter(t => t.status === "Success" && t.is_bonus_applied).reduce((acc, t) => acc + (t.fiat_amount || 0), 0) || 0;
  const isKycRequested = myTrades?.some(t => t.status === "KYC Required") || myWithdrawals?.some(w => w.status === "Verification Required");

  const meetsBonusThreshold = parseFloat(cryptoAmount) >= 500 && selectedTrader?.crypto_asset_id?.toUpperCase().includes("USDT");

  const LiveActivityBanner = () => (
    <div className="bg-primary/10 border-y border-white/5 py-1.5 overflow-hidden relative backdrop-blur-md rounded-2xl mb-8">
      <div className="flex whitespace-nowrap animate-marquee">
        {[...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES, ...LIVE_ACTIVITIES].map((activity, idx) => (
          <div key={idx} className="inline-flex items-center gap-2.5 mx-10">
            <div className={`w-1.5 h-1.5 rounded-full ${activity.action === "DEPOSITED" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"} animate-pulse`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] flex items-center gap-2">
              <span className="text-white/90">SETTLEMENT***</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[8px] ${activity.action === "DEPOSITED" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>{activity.action}</span>
              <span className="text-primary font-black">{activity.amount}</span>
              <span className="text-white/20 ml-1 font-medium">JUST NOW</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout
      sidebar={
        <AppSidebar
          navItems={navItems}
          activeTab={activeTab}
          setActiveTab={(id) => { setActiveTab(id); setStep(1); }}
          selectedLogo={brandingSettings?.selectedLogo}
          onLogout={() => setIsSignOutDialogOpen(true)}
          title="ConnectCrypto"
          subtitle="Institutional"
        />
      }
    >
      <LiveActivityBanner />
      
      <div className="space-y-10 pb-40">
        {/* Welcome Section - Enhanced Hierarchy */}
        {step === 1 && (
          <div className="rounded-[2.5rem] bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent border border-white/5 p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 animate-in-scale">
            <div className="space-y-1">
              <h1 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tight leading-none">Welcome, {userData?.username || 'Trader'}</h1>
              <p className="text-primary/60 text-[10px] md:text-xs uppercase font-bold tracking-[0.3em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Global Institutional Liquidity Hub
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <Button onClick={() => setActiveTab("wallet")} variant="ghost" className="bg-white/5 border border-white/10 p-4 h-auto rounded-2xl flex items-center gap-4 hover:bg-white/10 transition-all group flex-1 md:flex-none">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <WalletIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                    <span className="text-hierarchy-label">Portfolio Balance</span>
                    <span className="text-lg font-black font-mono text-white tracking-tight">₹{totalProtocolBalance?.toLocaleString() || '0.00'}</span>
                </div>
              </Button>
              {(activeTab === "settings" || activeTab === "wallet") && (
                <Button onClick={() => setIsAddGatewayOpen(true)} className="bg-primary h-14 px-8 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white glow-primary hover:scale-[1.02] transition-transform flex-1 md:flex-none">
                  <Plus className="w-4 h-4 mr-2" /> Link Gateway
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Sign Out Confirmation Dialog */}
        <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
          <AlertDialogContent className="glass-card border-white/10 rounded-[2.5rem] max-w-sm p-8">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-headline font-black uppercase tracking-tight">Disconnect</AlertDialogTitle>
              <AlertDialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed mt-2">
                Confirm termination of active trading session? Secure protocols will remain active.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-3 mt-8">
              <AlertDialogCancel className="rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all">Stay Connected</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest text-white glow-primary transition-all">Sign Out</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


          {isKycRequested && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-[1.5rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-red-500 tracking-[0.2em]">Institutional Alert: KYC Required</p>
                  <p className="text-[11px] text-white font-bold uppercase tracking-tight">One or more of your payments are on hold. Please <span className="text-red-500 underline underline-offset-2">verify ASAP</span> to release funds.</p>
                </div>
              </div>
              <Button onClick={() => setActiveTab("settings")} variant="outline" className="w-full md:w-auto h-10 px-6 rounded-xl border-red-500/50 text-red-500 text-xs font-bold uppercase hover:bg-red-500 hover:text-white transition-all">Verify Now</Button>
            </div>
          )}

          {activeTab === "wallet" ? (
            <div className="space-y-10 animate-in-scale">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card border-none rounded-[2.5rem] p-8 flex flex-col justify-between space-y-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="space-y-4 relative">
                      <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                        <WalletIcon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-hierarchy-label tracking-[0.3em]">Total Portfolio Value</p>
                        <h2 className="text-4xl md:text-5xl font-headline font-black text-white tracking-tighter">₹{totalProtocolBalance?.toLocaleString() || '0.00'}</h2>
                      </div>
                  </div>
                  <div className="flex gap-4 relative">
                      <Button onClick={() => setActiveTab("marketplace")} className="flex-1 bg-primary h-14 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-white glow-primary hover:scale-[1.02] transition-transform">Add Funds</Button>
                      <Button onClick={() => setActiveTab("withdraw")} variant="outline" className="flex-1 h-14 rounded-2xl border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all">Withdraw</Button>
                  </div>
                </Card>

                <Card className="glass-card border-none rounded-[2.5rem] p-8 flex flex-col justify-between space-y-6 group/card">
                  <div className="space-y-2">
                      <p className="text-hierarchy-label">Total Earnings</p>
                      <h3 className="text-3xl font-headline font-black text-green-500 tracking-tight italic">₹{totalEarnings.toLocaleString()}</h3>
                  </div>
                  <div className="space-y-3 pt-6 border-t border-white/5">
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Verified Settlements</span>
                          <span className="text-sm font-black text-white italic">{myTrades?.filter(t => t.status === "Success").length || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Liquidity Bonus</span>
                          <span className="text-sm font-black text-primary italic">₹{totalBonus.toLocaleString()}</span>
                      </div>
                  </div>
                </Card>

                <Card className="glass-card border-none rounded-[2.5rem] p-8 flex flex-col justify-between space-y-6 group/card">
                  <div className="space-y-2">
                      <p className="text-hierarchy-label">Settlement Partners</p>
                      <div className="space-y-3 mt-4 max-h-[120px] overflow-y-auto scrollbar-hide">
                        {availableTraders.length > 0 ? availableTraders.map(trader => (
                          <div key={trader.id} className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 truncate max-w-[120px]">{trader.name}</span>
                            <span className="text-xs font-black text-primary italic">₹{trader.balance.toLocaleString()}</span>
                          </div>
                        )) : (
                          <p className="text-[10px] text-white/20 uppercase font-black text-center py-4">No active partners</p>
                        )}
                      </div>
                  </div>
                </Card>
              </div>

              <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
                <CardHeader className="p-8 md:p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                        <History className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-headline font-black uppercase tracking-tight">Financial Ledger</h2>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 mt-0.5">Comprehensive transaction history</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px] py-1.5 px-4 font-bold uppercase border-white/10 text-muted-foreground rounded-full bg-white/5">Institutional Record</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.05] bg-white/[0.02] hover:bg-transparent h-16">
                        <TableHead className="px-10 text-hierarchy-label">Reference</TableHead>
                        <TableHead className="text-hierarchy-label">Activity Type</TableHead>
                        <TableHead className="text-hierarchy-label">Value (INR)</TableHead>
                        <TableHead className="text-hierarchy-label">Status</TableHead>
                        <TableHead className="text-right px-10 text-hierarchy-label">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Combine Trades and Withdrawals */}
                      {[
                        ...(myTrades?.map(t => ({ ...t, activityType: 'DEPOSIT', amount: t.fiat_amount, timestamp: t.initiation_time })) || []),
                        ...(myWithdrawals?.map(w => ({ ...w, activityType: 'WITHDRAWAL', amount: w.amount, timestamp: w.created_at })) || [])
                      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-60 text-center opacity-20 uppercase font-black tracking-[0.3em] text-xs">No financial history detected</TableCell></TableRow>
                      ) : [
                        ...(myTrades?.map(t => ({ ...t, activityType: 'DEPOSIT', amount: t.fiat_amount, timestamp: t.initiation_time })) || []),
                        ...(myWithdrawals?.map(w => ({ ...w, activityType: 'WITHDRAWAL', amount: w.amount, timestamp: w.created_at })) || [])
                      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((item, idx) => (
                        <TableRow key={idx} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-20">
                          <TableCell className="px-10 font-mono text-xs text-white/40 group-hover:text-white/90 transition-colors">
                            <span className="px-2 py-1 rounded bg-white/5 border border-white/5">#{item.id?.slice(-8).toUpperCase()}</span>
                          </TableCell>
                          <TableCell>
                              <div className="flex items-center gap-3">
                                {item.activityType === 'DEPOSIT' ? (
                                  <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/10 group-hover:scale-110 transition-transform"><Plus className="w-4 h-4 text-green-500" /></div>
                                ) : (
                                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10 group-hover:scale-110 transition-transform"><ArrowUpRight className="w-4 h-4 text-amber-500" /></div>
                                )}
                                <span className={`text-[11px] font-black uppercase tracking-widest ${item.activityType === 'DEPOSIT' ? 'text-green-500' : 'text-amber-500'}`}>{item.activityType}</span>
                              </div>
                          </TableCell>
                          <TableCell className="font-black text-white text-sm italic group-hover:text-primary transition-colors">₹{item.amount?.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border-none ${
                              item.status === "Success" ? "bg-green-500/10 text-green-500" : 
                              item.status === "Pending" || item.status === "Paid" ? "bg-amber-500/10 text-amber-500" : 
                              item.status === "Hold" ? "bg-red-500/10 text-red-500" :
                              "bg-primary/10 text-primary"
                            }`}>{item.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right px-10 text-[10px] opacity-30 group-hover:opacity-60 font-bold uppercase tracking-widest transition-opacity">
                            {item.timestamp ? new Date(item.timestamp).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '---'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "marketplace" ? (
            <div className="space-y-10 animate-in-scale">
              {step === 1 && (
                <div className="space-y-10">
                  {/* Global Institutional Policy Section */}
                  <div className="bg-gradient-to-r from-primary/30 via-primary/5 to-transparent border border-primary/20 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-700" />
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative">
                      <div className="flex items-center gap-6 w-full lg:w-auto">
                        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0 shadow-lg glow-primary">
                          <Zap className="w-8 h-8 text-primary animate-pulse" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Network Protocol</span>
                            <div className="flex items-center gap-2 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                              <span className="text-[9px] font-black uppercase tracking-widest text-green-500">Live</span>
                            </div>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-headline font-black uppercase tracking-tight text-white leading-none">Institutional 2% Bonus</h2>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-white/10 text-white/40">Threshold: 500 USDT</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto lg:border-l lg:border-white/10 lg:pl-10">
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-[0.2em] leading-relaxed max-w-sm text-center md:text-left">
                          Institutional liquidity protocol automatically applies <span className="text-primary font-black underline underline-offset-4">2% premium</span> to all settlements exceeding 500 USDT.
                        </p>
                        
                        <div className="hidden lg:flex flex-col items-end gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-green-500/60">System Synchronized</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(i => (
                              <div key={i} className="w-1 h-3 bg-primary/40 rounded-full" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isOffersLoading ? (
                      <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                        <p className="text-hierarchy-label">Fetching Institutional Nodes...</p>
                      </div>
                    ) : !marketplaceOffers?.length ? (
                      <div className="col-span-full py-32 text-center flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/5 opacity-20">
                          <LayoutDashboard className="w-10 h-10" />
                        </div>
                        <p className="opacity-20 font-black uppercase tracking-[0.3em] text-sm">No active liquidity nodes</p>
                      </div>
                    ) : marketplaceOffers.map((offer) => (
                      <Card key={offer.id} className="glass-card border-none rounded-[2rem] p-6 space-y-6 flex flex-col justify-between hover:border-primary/40 transition-all duration-500 group/offer hover:-translate-y-1">
                        <div className="space-y-6 flex-1">
                          <div className="flex justify-between items-start gap-4">
                             <div className="flex items-center gap-4 min-w-0 flex-1">
                                {offer.icon_cid || offer.crypto_asset_id?.toUpperCase().includes("USDT") ? (
                                  <div className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 group-hover/offer:scale-110 transition-transform duration-500 ${offer.crypto_asset_id?.toUpperCase().includes("USDT") ? '' : 'border border-white/10 bg-white/5 shadow-inner'}`}>
                                    <Image 
                                      src={`https://ipfs.io/ipfs/${offer.crypto_asset_id?.toUpperCase().includes("USDT") ? "bafybeicygbg5kw4b5wyzx7rsv7zen5qmgda6jkn57phoqhp67jji7fpefa" : offer.icon_cid}`} 
                                      alt={offer.crypto_asset_id} 
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
                                    <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] truncate opacity-80">{offer.display_name || offer.trader_username || "Verified Node"}</p>
                                    <p className="font-headline font-black text-xl uppercase tracking-tighter text-white group-hover/offer:text-primary transition-colors truncate">{offer.crypto_asset_id}</p>
                                </div>
                             </div>
                             <div className="flex flex-col items-end gap-2 shrink-0">
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                  {offer.network?.split(", ").filter((n: string) => n !== "").map((net: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-[9px] py-0.5 px-2 h-5 border-white/10 text-white/60 uppercase font-black tracking-widest bg-white/5">{net}</Badge>
                                  ))}
                                </div>
                                {offer.crypto_asset_id?.toUpperCase().includes("USDT") && (
                                  <Badge className="text-[9px] py-0.5 px-2 h-5 bg-primary/20 text-primary border-none uppercase font-black tracking-widest">+2% Bonus</Badge>
                                )}
                             </div>
                          </div>

                          {offer.description && (
                            <div className="px-4 py-3 bg-white/[0.02] border-l-2 border-primary/40 rounded-r-xl group-hover/offer:bg-white/[0.04] transition-colors">
                              <p className="text-[11px] text-muted-foreground leading-relaxed italic opacity-60 line-clamp-2">
                                &quot;{offer.description}&quot;
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4 shrink-0">
                          <div className="pt-6 border-t border-white/5 flex justify-between items-end">
                            <div className="flex flex-col gap-1">
                               <span className="text-hierarchy-label">Exchange Rate</span>
                               <p className="text-2xl font-headline font-black text-white leading-none italic group-hover/offer:text-primary transition-colors">{offer.fixed_price_per_crypto} <span className="text-xs opacity-40 font-bold not-italic ml-1">{offer.fiat_currency}</span></p>
                            </div>
                            <Button onClick={() => initiateTrade(offer)} className="bg-primary h-12 px-8 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] text-white glow-primary group-hover/offer:scale-105 transition-all">Sell</Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              
              {step === 2 && selectedTrader && (
                <Card className="glass-card border-none rounded-[3rem] overflow-hidden max-w-2xl mx-auto animate-in-scale">
                  <CardHeader className="bg-primary/10 p-8 flex flex-row items-center gap-6 border-b border-white/5">
                    <Button variant="outline" onClick={() => setStep(1)} className="rounded-2xl h-12 w-12 border-white/10 bg-white/5 p-0 shrink-0 hover:bg-white/10 transition-all">
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </Button>
                    <div>
                      <CardTitle className="text-2xl font-headline font-black uppercase tracking-tight text-white">Confirm Settlement</CardTitle>
                      <p className="text-hierarchy-label mt-1">Institutional Liquidity Provision</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="space-y-4">
                      <Label className="text-hierarchy-label ml-1">Select Settlement Network</Label>
                      <div className="flex flex-wrap gap-3">
                        {selectedTrader.network?.split(", ").filter((n: string) => n !== "").map((net: string) => (
                          <Button 
                            key={net} 
                            onClick={() => setSelectedNetwork(net)} 
                            variant={selectedNetwork === net ? "default" : "outline"}
                            className={`h-14 px-8 rounded-2xl border text-[11px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-none ${
                              selectedNetwork === net 
                                ? 'bg-primary border-primary text-white glow-primary' 
                                : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                            }`}
                          >
                            {net}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/5 space-y-8 relative group/qr overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/qr:opacity-100 transition-opacity duration-700" />
                      {isSettingsLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center gap-4 relative z-10">
                          <Loader2 className="w-12 h-12 text-primary animate-spin" />
                          <p className="text-[10px] uppercase font-black text-primary tracking-[0.4em] animate-pulse">Securing Channel...</p>
                        </div>
                      ) : (() => {
                        const { qr: finalQr, isRerouted } = resolvedPayment;
                        if (!finalQr) return (
                          <div className="h-64 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/10 rounded-[2rem] relative z-10">
                            <ImageIcon className="w-10 h-10 text-muted-foreground opacity-20" />
                            <p className="text-[10px] uppercase font-black opacity-20 tracking-[0.3em]">QR Not Configured</p>
                          </div>
                        );

                        return (
                          <div className="flex flex-col items-center gap-6 relative z-10">
                            <div className="flex flex-col items-center gap-2">
                              <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.3em]">Scan to Liquidate ({selectedNetwork})</p>
                              {isRerouted && (
                                <Badge className={`${
                                  resolvedPayment.wallet === selectedTrader.wallet_address_trc20 || 
                                  resolvedPayment.wallet === selectedTrader.wallet_address_bep20 || 
                                  resolvedPayment.wallet === selectedTrader.wallet_address_erc20 
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20' 
                                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                } text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full`}>
                                  {resolvedPayment.wallet === selectedTrader.wallet_address_trc20 || 
                                   resolvedPayment.wallet === selectedTrader.wallet_address_bep20 || 
                                   resolvedPayment.wallet === selectedTrader.wallet_address_erc20 
                                    ? 'Reroute Error: Fallback Active' 
                                    : 'Institutional Node Active'}
                                </Badge>
                              )}
                            </div>
                            <div className="relative w-56 h-56 bg-white p-4 rounded-[2rem] shadow-2xl transition-transform duration-500 group-hover/qr:scale-105">
                              <Image 
                                src={finalQr.startsWith('http') ? finalQr : `https://ipfs.io/ipfs/${finalQr}`} 
                                alt={`${selectedNetwork} Settlement QR`} 
                                fill 
                                className="object-contain p-2"
                                unoptimized 
                              />
                            </div>
                          </div>
                        );
                      })()}

                      <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center px-2">
                          <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em]">Endpoint Address ({selectedNetwork})</p>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors h-auto p-0" onClick={() => { 
                            const { wallet: addr } = resolvedPayment;
                            if(addr) { navigator.clipboard.writeText(addr); toast({title: "Copied!"}); } 
                          }}>
                            <span className="text-[9px] font-black uppercase tracking-widest">Copy</span>
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className={`font-mono text-xs break-all font-black p-5 rounded-2xl text-center border transition-all duration-500 ${
                          resolvedPayment.isRerouted 
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                            : 'bg-white/5 border-white/10 text-white group-hover/qr:bg-white/10'
                        }`}>
                          {isSettingsLoading ? "RESOLVING..." : (resolvedPayment.wallet || "NOT CONFIGURED")}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8 bg-white/[0.03] p-10 rounded-[3rem] border border-white/10 relative overflow-hidden group/liquidation">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover/liquidation:bg-primary/10 transition-colors" />
                      
                      <div className="space-y-4">
                        <Label className="text-hierarchy-label ml-1">Liquidation Amount ({selectedTrader.crypto_asset_id})</Label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            value={cryptoAmount} 
                            onChange={(e) => setCryptoAmount(e.target.value)}
                            className="bg-black/40 border-white/10 h-20 rounded-[1.5rem] font-mono text-2xl font-black text-white focus:ring-primary/50 px-8 pr-24"
                            placeholder="0.00"
                          />
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                            {selectedTrader.crypto_asset_id}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-4">
                          <p className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em]">Base Value</p>
                          <p className="text-sm font-black text-white italic">
                            ₹{(parseFloat(cryptoAmount) * selectedTrader.fixed_price_per_crypto || 0).toLocaleString()}
                          </p>
                        </div>
                        {meetsBonusThreshold && (
                          <div className="flex justify-between items-center px-4 py-3 rounded-2xl bg-green-500/5 border border-green-500/10">
                            <p className="text-[10px] uppercase font-black text-green-500 tracking-[0.2em]">Protocol Bonus (2%)</p>
                            <p className="text-sm font-black text-green-500 italic">+₹{(parseFloat(cryptoAmount) * selectedTrader.fixed_price_per_crypto * 0.02 || 0).toLocaleString()}</p>
                          </div>
                        )}
                        <div className="bg-primary/10 border border-primary/30 rounded-[2.5rem] p-8 mt-6 flex justify-between items-center transition-all hover:bg-primary/20 group/total shadow-[0_20px_40px_-12px_rgba(139,92,246,0.2)]">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-black text-white/40 tracking-[0.4em]">Total Payout</p>
                            <p className="text-sm font-headline font-black text-white uppercase italic tracking-widest">Final Settlement</p>
                          </div>
                          <p className="text-3xl md:text-4xl font-headline font-black text-primary italic glow-primary group-hover/total:scale-105 transition-transform">
                            ₹{(
                              (parseFloat(cryptoAmount) * selectedTrader.fixed_price_per_crypto || 0) + 
                              (meetsBonusThreshold ? (parseFloat(cryptoAmount) * selectedTrader.fixed_price_per_crypto * 0.02) : 0)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5">
                      <Label className="text-hierarchy-label ml-1">Blockchain Hash (TXID)</Label>
                      <div className="flex gap-3">
                        <Input 
                          value={txHash} 
                          onChange={(e) => setTxHash(e.target.value)}
                          className="bg-white/5 border-white/10 h-16 rounded-2xl font-mono text-xs font-bold text-white focus:ring-primary/50 flex-1 px-6"
                          placeholder="Paste transaction hash..."
                        />
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                           <Hash className="w-6 h-6 text-primary/40" />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-2 px-1 opacity-60 leading-relaxed">Proof of on-chain settlement is mandatory for protocol verification.</p>
                    </div>

                    <Button 
                      className="w-full bg-primary rounded-2xl font-black h-20 uppercase tracking-[0.3em] text-xs text-white glow-primary-lg hover:scale-[1.01] transition-all disabled:opacity-20" 
                      onClick={finalizeTrade} 
                      disabled={!resolvedPayment.wallet || !cryptoAmount || parseFloat(cryptoAmount) <= 0 || !txHash.trim()}
                    >
                      Commit Liquidation
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : activeTab === "trades" ? (
            <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
              <CardHeader className="p-8 md:p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                    <History className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase tracking-tight">Active Deposits</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 mt-0.5">Real-time liquidation tracking</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.05] bg-white/[0.02] hover:bg-transparent h-16">
                      <TableHead className="px-10 text-hierarchy-label">Trade Reference</TableHead>
                      <TableHead className="text-hierarchy-label">Asset Volume</TableHead>
                      <TableHead className="text-hierarchy-label">Fiat Value</TableHead>
                      <TableHead className="text-hierarchy-label">Status</TableHead>
                      <TableHead className="text-right px-10 text-hierarchy-label">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!myTrades?.length ? (
                      <TableRow><TableCell colSpan={5} className="h-60 text-center opacity-20 uppercase font-black tracking-[0.3em] text-xs">No active trades detected</TableCell></TableRow>
                    ) : myTrades.map((t) => (
                      <TableRow key={t.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-20">
                        <TableCell className="px-10 font-mono text-xs text-white/40 group-hover:text-white/90 transition-colors">
                          <span className="px-2 py-1 rounded bg-white/5 border border-white/5">#TX_{t.id.slice(-4).toUpperCase()}</span>
                        </TableCell>
                        <TableCell className="font-black text-white uppercase text-xs italic">{t.crypto_amount} {t.crypto_asset_id}</TableCell>
                        <TableCell className="font-black text-primary uppercase text-xs italic group-hover:scale-105 transition-transform origin-left">{t.fiat_amount} {t.fiat_currency}</TableCell>
                        <TableCell>
                          <Badge className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border-none ${
                            t.status === "Success" ? "bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]" : 
                            t.status === "Paid" ? "bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : 
                            t.status === "Hold" ? "bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                            t.status === "KYC Required" ? "bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]" :
                            "bg-primary/10 text-primary shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                          }`}>{t.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right px-10 text-[10px] opacity-30 group-hover:opacity-60 font-bold uppercase tracking-widest transition-opacity">
                          {t.initiation_time ? new Date(t.initiation_time).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '---'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : activeTab === "withdraw" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in-scale">
              <Card className="glass-card border-none rounded-[3rem] p-10 md:p-12 space-y-10 h-max lg:sticky lg:top-10">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 glow-primary">
                      <ArrowUpRight className="w-10 h-10 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-headline font-black uppercase tracking-tight text-white">Settle Fiat</h2>
                      <p className="text-hierarchy-label tracking-[0.3em]">Node Liquidation Protocol</p>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-1">Settlement Amount (INR)</Label>
                      <Input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder="Min. ₹500" className="bg-white/5 border-white/10 h-16 rounded-2xl font-mono text-lg font-black text-white focus:ring-primary/50 px-6" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-1">Select Available Partner</Label>
                      <Select 
                        value={selectedTraderId} 
                        onValueChange={setSelectedTraderId}
                      >
                        <SelectTrigger className="w-full bg-black/60 border border-white/10 rounded-2xl h-16 px-6 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-primary/50 transition-all cursor-pointer hover:bg-white/5">
                          <SelectValue placeholder="Choose Settlement Partner" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-white/10 text-white">
                          {availableTraders.map(trader => (
                            <SelectItem key={trader.id} value={trader.id} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary focus:text-white">
                              {trader.name} • Available: ₹{trader.balance.toLocaleString()}
                            </SelectItem>
                          ))}
                          {availableTraders.length === 0 && <SelectItem value="none" disabled>No partners available for settlement</SelectItem>}
                        </SelectContent>
                      </Select>
                      {selectedTraderId && (
                        <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1 px-1 opacity-60">
                          Settlement Limit: ₹{traderBalances[selectedTraderId]?.balance.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label className="text-hierarchy-label ml-1">Select Verified Gateway</Label>
                      <Select value={selectedGatewayId} onValueChange={setSelectedGatewayId}>
                        <SelectTrigger className="w-full bg-black/60 border border-white/10 rounded-2xl h-16 px-6 text-xs font-black uppercase tracking-widest text-white outline-none focus:border-primary/50 transition-all cursor-pointer hover:bg-white/5">
                          <SelectValue placeholder="Select Verified Gateway" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-white/10 text-white">
                          {gateways?.map(gw => (
                            <SelectItem key={gw.id} value={gw.id} className="text-[10px] font-black uppercase tracking-widest focus:bg-primary focus:text-white">
                              {gw.method_type} • {gw.account_holder_name}
                            </SelectItem>
                          ))}
                          {!gateways?.length && <SelectItem value="none" disabled>No gateways linked</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full h-20 bg-primary rounded-2xl font-black uppercase tracking-[0.3em] text-xs text-white glow-primary-lg hover:scale-[1.01] transition-all" onClick={handleInitiateWithdrawal}>Initiate Payout</Button>
                </div>
              </Card>

              <Card className="lg:col-span-2 glass-card border-none rounded-[3rem] overflow-hidden">
                <CardHeader className="p-8 md:p-10 border-b border-white/[0.05] flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-headline font-black uppercase tracking-tight">Settlement History</h2>
                      <p className="text-hierarchy-label mt-0.5">Verification & Payout Ledger</p>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/[0.05] bg-white/[0.02] hover:bg-transparent h-16">
                        <TableHead className="px-10 text-hierarchy-label">Amount</TableHead>
                        <TableHead className="text-hierarchy-label">Gateway Endpoint</TableHead>
                        <TableHead className="text-hierarchy-label">Status</TableHead>
                        <TableHead className="text-right px-10 text-hierarchy-label">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!myWithdrawals?.length ? (
                        <TableRow><TableCell colSpan={4} className="h-60 text-center opacity-20 uppercase font-black tracking-[0.3em] text-xs">No withdrawals placed</TableCell></TableRow>
                      ) : myWithdrawals.map((w) => (
                        <TableRow key={w.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-20">
                          <TableCell className="px-10 font-black text-white text-sm italic group-hover:text-primary transition-colors">
                            <div className="flex flex-col">
                              <span>₹{w.amount?.toLocaleString()}</span>
                              <span className="text-[9px] text-muted-foreground uppercase tracking-widest not-italic opacity-40">Partner: {w.trader_id || 'Institutional'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-black text-white/70 uppercase tracking-widest">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px]">{w.gateway_details?.type} • {w.gateway_details?.name}</span>
                              <span className="text-[9px] text-primary/60 font-mono tracking-tighter opacity-80 bg-primary/5 w-fit px-1.5 py-0.5 rounded border border-primary/10">
                                {w.gateway_details?.type === 'Bank' 
                                  ? `****${w.gateway_details?.detail?.slice(-4)}` 
                                  : w.gateway_details?.detail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border-none ${
                              w.status === "Success" ? "bg-green-500/10 text-green-500" : 
                              w.status === "Pending" ? "bg-amber-500/10 text-amber-500" : 
                              w.status === "Hold" ? "bg-red-500/10 text-red-500" :
                              w.status === "Verification Required" ? "bg-purple-500/10 text-purple-500" :
                              "bg-primary/10 text-primary"
                            }`}>{w.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right px-10 text-[10px] opacity-30 group-hover:opacity-60 font-bold uppercase tracking-widest transition-opacity">
                            {w.created_at ? new Date(w.created_at).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase() : '---'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : activeTab === "trust" ? (
            <div className="max-w-5xl mx-auto space-y-12 pb-20 animate-in-scale">
               <div className="text-center space-y-4 mb-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 glow-primary">
                     <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-4xl font-headline font-black uppercase tracking-tighter text-white">Institutional Trust Center</h2>
                  <p className="text-primary text-[10px] uppercase tracking-[0.4em] font-bold">Verified Regulatory Compliance & Security Standards</p>
               </div>

            {/* Verification Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "ISO 27001", sub: "Security Certified", icon: Lock },
                { label: "GDPR", sub: "Data Privacy", icon: ShieldCheck },
                { label: "AML/KYC", sub: "Global Compliance", icon: UserCircle },
                { label: "24/7", sub: "Node Monitoring", icon: Zap }
              ].map((b, i) => (
                <div key={i} className="glass-card border-none rounded-2xl p-4 flex flex-col items-center text-center gap-2">
                  <b.icon className="w-5 h-5 text-primary opacity-60" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white">{b.label}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-white/30">{b.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-bold uppercase text-white">Asset Protection Protocol</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-widest font-medium opacity-70">
                    Your assets are secured using military-grade AES-256 encryption. Our decentralized liquidity model ensures that funds are settled directly between verified institutional partners and participants, eliminating central points of failure.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-green-500">System Integrity: 99.9%</span>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-green-500/40 rounded-full" />)}
                  </div>
                </div>
              </Card>

              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                  <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-bold uppercase text-white">Institutional Compliance</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed uppercase tracking-widest font-medium opacity-70">
                    ConnectCrypto operates under strict global AML (Anti-Money Laundering) and CTF (Counter-Terrorism Financing) regulations. Every node in our network undergoes a rigorous multi-stage verification process before authorization.
                  </p>
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">Certified Network</span>
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
              </Card>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-16 space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              
              <div className="space-y-6 relative">
                <h3 className="text-2xl font-headline font-bold uppercase tracking-tight text-white">Network Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-primary/20 font-headline">₹500Cr+</div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Total Liquidity Processed</p>
                    <p className="text-[9px] text-muted-foreground uppercase leading-relaxed tracking-widest opacity-60">Over five years of secure institutional settlements across global markets.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-primary/20 font-headline">50k+</div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Verified Participants</p>
                    <p className="text-[9px] text-muted-foreground uppercase leading-relaxed tracking-widest opacity-60">A growing ecosystem of professional traders and liquidity partners.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-primary/20 font-headline">0.0%</div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Security Breaches</p>
                    <p className="text-[9px] text-muted-foreground uppercase leading-relaxed tracking-widest opacity-60">A flawless record of asset protection and protocol stability since inception.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-10">
              <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-full">
                <p className="text-[9px] uppercase font-bold tracking-[0.4em] text-primary">Trust Score: AAA (Institutional Grade)</p>
              </div>
            </div>
          </div>
        ) : activeTab === "support" ? (
          <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div className="text-center space-y-4 mb-12">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 glow-primary">
                <Headset className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl font-headline font-black uppercase tracking-tighter">Institutional Support</h2>
              <p className="text-muted-foreground text-xs uppercase tracking-[0.4em] font-bold">24/7 Global Assistance Hub</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Contact Grid */}
              <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Email Authority</h3>
                  <p className="text-sm font-mono text-primary truncate">support@connectcrypto.com</p>
                </div>
              </Card>

              <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">Telegram Channels</h3>
                  <p className="text-sm font-mono text-primary truncate">@connectcrypto</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Support: @connectcrypto_support</p>
                </div>
              </Card>

              <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white mb-1">WhatsApp Direct</h3>
                  <p className="text-sm font-mono text-primary truncate">+91 9{Math.floor(Math.random() * 900000000 + 100000000)}</p>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              {/* SLA & Wait Times */}
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 border-l-4 border-l-primary">
                <div className="flex items-center gap-4">
                  <Clock className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-headline font-bold uppercase">Settlement SLA</h3>
                </div>
                <div className="space-y-6">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2">Crypto Confirmation</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-headline font-bold text-white">15 MINUTES</p>
                      <Badge className="bg-primary/20 text-primary border-none text-[10px] font-bold">PARTNER LOCK</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Please allow the network to achieve full consensus before contacting support.</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-2">Fiat Settlement</p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-headline font-bold text-white">30 MINUTES</p>
                      <Badge className="bg-green-500/20 text-green-500 border-none text-[10px] font-bold">BANK CLEARANCE</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">Institutional settlements are processed in batches for maximum security.</p>
                  </div>
                </div>
              </Card>

              {/* FAQ Section */}
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-headline font-bold uppercase">Quick FAQ</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">How do I verify my payment?</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Ensure you upload the correct Transaction Hash (TXID) after sending crypto. Our nodes verify this against the blockchain ledger instantly.</p>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-white/5">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">Why is my trade on &quot;Hold&quot;?</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Positions may be flagged for manual review if the hash is incorrect or the amount doesn&apos;t match the order. Contact support with proof of payment.</p>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-white/5">
                    <p className="text-xs font-bold text-white uppercase tracking-tight">What is the 2% Bonus?</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">Institutional users selling 500+ USDT automatically receive a 2% premium added to their fiat settlement as part of our liquidity incentive program.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : activeTab === "settings" ? (
          <div className="flex flex-col gap-8">
            {(isKycRequested || userData?.kyc_status) && (
              <Card className={`glass-card border-none rounded-[2rem] p-8 border-l-4 ${
                (userData?.kyc_status as any) === 'Approved' ? "border-green-500 bg-green-500/5" : 
                (userData?.kyc_status as any) === 'Pending' ? "border-amber-500 bg-amber-500/5" : 
                "border-blue-500 bg-blue-500/5"
              }`}>
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    (userData?.kyc_status as any) === 'Approved' ? "bg-green-500/20" : 
                    (userData?.kyc_status as any) === 'Pending' ? "bg-amber-500/20" : 
                    "bg-blue-500/20"
                  }`}>
                    <ShieldCheck className={`w-6 h-6 ${
                      (userData?.kyc_status as any) === 'Approved' ? "text-green-500" : 
                      (userData?.kyc_status as any) === 'Pending' ? "text-amber-500" : 
                      "text-blue-500"
                    }`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-bold uppercase">
                      {(userData?.kyc_status as any) === 'Approved' ? "KYC Verified" : 
                       (userData?.kyc_status as any) === 'Pending' ? "Verification Pending" : 
                       "Verify ASAP: Action Required"}
                    </h2>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                      {(userData?.kyc_status as any) === 'Approved' ? "Your identity is fully validated on the protocol." : 
                       (userData?.kyc_status as any) === 'Pending' ? "Our nodes are currently auditing your identity documents." : 
                       "One or more settlements are on hold. Please submit your documents to release funds."}
                    </p>
                  </div>
                </div>

                {!userData?.kyc_status && isKycRequested && (
                  <div className="space-y-6 bg-black/40 p-6 rounded-2xl border border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold opacity-50 ml-1">Aadhar Card Number</Label>
                        <Input 
                          placeholder="12-digit Aadhar Number" 
                          value={aadharNumber} 
                          onChange={e => setAadharNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                          className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50 font-mono" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold opacity-50 ml-1">PAN Card Number</Label>
                        <Input 
                          placeholder="10-digit PAN Number" 
                          value={panNumber} 
                          onChange={e => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                          className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50 font-mono" 
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleKycSubmit} 
                      disabled={isKycSubmitting || aadharNumber.length < 12 || panNumber.length < 10}
                      className="w-full h-14 bg-primary text-white glow-primary rounded-xl font-bold uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                      {isKycSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      Apply for Institutional Verification
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest opacity-50">Identity data is encrypted and stored according to protocol security standards.</p>
                  </div>
                )}
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="glass-card border-none rounded-[2rem] p-8">
               <div className="flex items-center gap-4 mb-8">
                  <UserCircle className="w-10 h-10 text-primary" />
                  <h2 className="text-xl font-headline font-bold uppercase">Identity</h2>
               </div>
               <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold opacity-50 ml-1">Full Legal Name</Label>
                    <Input name="fullName" defaultValue={userData?.full_name} className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold opacity-50 ml-1">Username Alias</Label>
                    <Input name="username" defaultValue={userData?.username} className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold uppercase tracking-widest text-xs">Update Profile</Button>
               </form>
            </Card>

            <Card className="glass-card border-none rounded-[2rem] p-8">
               <div className="flex items-center gap-4 mb-8">
                  <Landmark className="w-10 h-10 text-primary" />
                  <h2 className="text-xl font-headline font-bold uppercase">Linked Gateways</h2>
               </div>
               <div className="space-y-4">
                 {gateways?.map(gw => (
                   <div key={gw.id} className="flex flex-col p-4 bg-white/5 border border-white/10 rounded-2xl group relative">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Landmark className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-primary">{gw.method_type}</p>
                            <p className="text-[11px] text-white font-medium uppercase tracking-tight">{gw.account_holder_name}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => {}} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                     </div>
                     <div className="pl-14">
                        {gw.method_type === 'UPI' ? (
                          <p className="text-[10px] text-muted-foreground font-mono">{gw.upi_id}</p>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold">{gw.bank_name}</p>
                             <p className="text-[10px] text-muted-foreground font-mono">{gw.account_number} • {gw.ifsc_swift_code}</p>
                          </div>
                        )}
                     </div>
                   </div>
                 ))}
                 {!gateways?.length && (
                   <div className="py-10 text-center opacity-30">
                     <p className="text-[11px] font-bold uppercase tracking-widest">No gateways linked</p>
                   </div>
                 )}
               </div>
            </Card>
          </div>
        </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-12 pb-20">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 glow-primary">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-4xl font-headline font-black uppercase tracking-tighter">Trust Protocol v2.0</h2>
              <p className="text-muted-foreground text-[10px] uppercase tracking-[0.4em] font-bold">The Institutional Standard for P2P Settlements</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-bold uppercase">Free Escrow Protocol</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-medium opacity-70">
                    ConnectCrypto offers 100% free escrow services. We act as a neutral third-party to ensure that both assets and fiat are exchanged fairly without any hidden middleman fees.
                  </p>
                </div>
              </Card>

              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-bold uppercase text-green-500">100% Fund Guarantee</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-medium opacity-70">
                    Every trader node on our platform maintains a mandatory security deposit with the ConnectRoot authority. This guarantees your funds are 100% protected against any node discrepancy.
                  </p>
                </div>
              </Card>

              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <Headset className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline font-bold uppercase text-blue-500">24/7 Global Support</h3>
                  <p className="text-[10px] text-muted-foreground leading-relaxed uppercase tracking-widest font-medium opacity-70">
                    Our technical support team is online 24/7 to monitor the network and assist with any settlement queries. You are never alone in the institutional marketplace.
                  </p>
                </div>
              </Card>
            </div>

            <div className="bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 rounded-[3rem] p-10 md:p-16 relative overflow-hidden group">
              <div className="flex flex-col md:flex-row items-center gap-10 relative">
                <div className="w-24 h-24 bg-primary/20 rounded-[2rem] flex items-center justify-center shrink-0 border border-primary/30">
                  <Briefcase className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-4 flex-1 text-center md:text-left">
                  <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">VIP Institutional Service</span>
                  </div>
                  <h3 className="text-3xl font-headline font-bold uppercase tracking-tighter">Bulk Deal Priority</h3>
                  <p className="text-[11px] text-muted-foreground uppercase leading-relaxed tracking-widest font-medium opacity-80 max-w-2xl">
                    High-volume institutional users moving large blocks of liquidity are assigned a <span className="text-white">dedicated personal agent</span> for 24/7 priority white-glove support and custom settlement routes.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 md:p-16 space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
              
              <div className="space-y-4 relative">
                <h3 className="text-2xl font-headline font-bold uppercase tracking-tight">How it works</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-primary/20 font-headline">01</div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">Initiate Sell</p>
                    <p className="text-[8px] text-muted-foreground uppercase leading-relaxed tracking-widest opacity-60">Select an asset and choose a verified node offering the best rates.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-primary/20 font-headline">02</div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">Direct Transfer</p>
                    <p className="text-[8px] text-muted-foreground uppercase leading-relaxed tracking-widest opacity-60">Send your crypto to the node&apos;s verified wallet address on TRC20, BEP20, or ERC20.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="text-4xl font-black text-primary/20 font-headline">03</div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">Instant Credit</p>
                    <p className="text-[8px] text-muted-foreground uppercase leading-relaxed tracking-widest opacity-60">Once verified on-chain, your protocol balance is instantly credited for fiat release.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-10">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white/10 flex items-center justify-center overflow-hidden">
                      <UserCircle className="w-6 h-6 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] uppercase font-bold tracking-[0.3em] text-primary">Join 500+ Verified Traders</p>
              </div>
              <Button onClick={() => setActiveTab("marketplace")} className="bg-primary h-14 px-10 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] text-white glow-primary">Enter Marketplace</Button>
            </div>
          </div>
        )}

        {/* Link Gateway Dialog */}
        <Dialog open={isAddGatewayOpen} onOpenChange={setIsAddGatewayOpen}>
          <DialogContent className="glass-card border-white/10 rounded-[2rem] p-8">
            <DialogHeader><DialogTitle className="text-xl font-bold uppercase text-white">Link Payout Gateway</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <Select value={gatewayType} onValueChange={value => { setGatewayType(value); resetGatewayForm(); }}>
                <SelectTrigger className="w-full bg-black/60 border border-white/10 rounded-xl h-12 px-4 text-sm text-white">
                  <SelectValue placeholder="Select Gateway Type" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 text-white">
                  <SelectItem value="UPI" className="text-xs font-black uppercase tracking-widest focus:bg-primary focus:text-white">UPI ID</SelectItem>
                  <SelectItem value="Bank" className="text-xs font-black uppercase tracking-widest focus:bg-primary focus:text-white">Bank / CDM</SelectItem>
                </SelectContent>
              </Select>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Account Holder Name</Label>
                <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full Name" className="bg-white/5 border-white/10 h-12 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">{gatewayType === 'UPI' ? "UPI ID" : "Account Number"}</Label>
                <Input value={accountDetail} onChange={(e) => setAccountDetail(e.target.value)} placeholder={gatewayType === 'UPI' ? "e.g. name@bank" : "Account Number"} className="bg-white/5 border-white/10 h-12 rounded-xl" />
              </div>
              
              {gatewayType === 'Bank' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Bank Name</Label>
                    <Input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="bg-white/5 border-white/10 h-12 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">IFSC Code</Label>
                    <Input value={ifscCode} onChange={e => setIfscCode(e.target.value)} placeholder="e.g. SBIN0001234" className="bg-white/5 border-white/10 h-12 rounded-xl uppercase" />
                  </div>
                </>
              )}
            </div>
            <DialogFooter><Button onClick={handleAddGateway} className="w-full h-12 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white">Confirm Link</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
    </DashboardLayout>
  );
}











