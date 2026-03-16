
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { 
  Users, 
  LogOut, 
  Loader2,
  Search,
  UserPlus,
  Key,
  Trash2,
  CheckCircle,
  ShieldCheck,
  Menu,
  X,
  CreditCard,
  LayoutDashboard,
  History,
  Edit2,
  Settings,
  Copy,
  ArrowUpRight,
  Plus,
  Image as ImageIcon,
  Headset,
  Mail,
  Send,
  Phone,
  Clock,
  Wallet,
  Globe,
  QrCode,
  ShieldAlert,
  Power,
  SwitchCamera
} from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSupabaseAuth } from "@/lib/supabase-auth-provider";
import { useSupabaseQuery, useSupabaseDoc } from "@/hooks/use-supabase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ISTTimer } from "@/components/ui/ist-timer";
import Image from "next/image";
import { USDTGoldLogo } from "@/components/logos/USDTGoldLogo";
import { USDTOriginalLogo } from "@/components/logos/USDTOriginalLogo";
import { User, TradeTransaction, WithdrawalRequest, TraderOffer, Profile } from "@/types";

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isUserLoading, signOut } = useSupabaseAuth();
  
  const [activeTab, setActiveTab] = useState("ledger");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newTraderEmail, setNewTraderEmail] = useState("");
  const [newTraderPass, setNewTraderPass] = useState("admin123");
  const [newTraderUsername, setNewTraderUsername] = useState("");
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPass, setEditPass] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);

  // Offer Management State
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [offerCrypto, setOfferCrypto] = useState("USDT");
  const [offerNetwork, setOfferNetwork] = useState("TRC20");
  const [offerFiat, setOfferFiat] = useState("INR");
  const [offerPrice, setOfferPrice] = useState("95.5");
  const [offerDisplayName, setOfferDisplayName] = useState("");
  const [offerDescription, setOfferDescription] = useState("");
  const [offerWalletTrc20, setOfferWalletTrc20] = useState("");
  const [offerWalletBep20, setOfferWalletBep20] = useState("");
  const [offerWalletErc20, setOfferWalletErc20] = useState("");
  const [offerQrTrc20, setOfferQrTrc20] = useState("");
  const [offerQrBep20, setOfferQrBep20] = useState("");
  const [offerQrErc20, setOfferQrErc20] = useState("");
  const [offerIconCid, setOfferIconCid] = useState("");
  const [selectedTraderId, setSelectedTraderId] = useState("");

  // Global Gateway State
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [isReroutingEnabled, setIsReroutingEnabled] = useState(false);
  const [adminWalletTrc20, setAdminWalletTrc20] = useState("");
  const [adminWalletBep20, setAdminWalletBep20] = useState("");
  const [adminWalletErc20, setAdminWalletErc20] = useState("");
  const [adminQrTrc20, setAdminQrTrc20] = useState("");
  const [adminQrBep20, setAdminQrBep20] = useState("");
  const [adminQrErc20, setAdminQrErc20] = useState("");
  const [isGatewayUpdating, setIsGatewayUpdating] = useState(false);

  // Branding State
  const [selectedLogo, setSelectedLogo] = useState<"gold" | "original">("original");
  const [isBrandingUpdating, setIsBrandingUpdating] = useState(false);

  const { data: userData, loading: isUserDataLoading } = useSupabaseDoc<Profile>("profiles", user?.id);

  const { data: globalSettings } = useSupabaseDoc<any>("global_settings", "default");

  useEffect(() => {
    if (globalSettings) {
      const gateway = globalSettings.global_gateway;
      setIsReroutingEnabled(gateway?.isReroutingEnabled || false);
      setAdminWalletTrc20(gateway?.trc20?.address || "");
      setAdminWalletBep20(gateway?.bep20?.address || "");
      setAdminWalletErc20(gateway?.erc20?.address || "");
      setAdminQrTrc20(gateway?.trc20?.qr || "");
      setAdminQrBep20(gateway?.bep20?.qr || "");
      setAdminQrErc20(gateway?.erc20?.qr || "");
    }
  }, [globalSettings]);

  useEffect(() => {
    if (globalSettings?.branding) {
      setSelectedLogo(globalSettings.branding.selectedLogo || "original");
    }
  }, [globalSettings]);

  const handleUpdateGlobalGateway = async () => {
    setIsGatewayUpdating(true);
    try {
      await supabase.from("global_settings").upsert({
        id: "default",
        global_gateway: {
          isReroutingEnabled,
          trc20: { address: adminWalletTrc20.trim(), qr: adminQrTrc20.trim() },
          bep20: { address: adminWalletBep20.trim(), qr: adminQrBep20.trim() },
          erc20: { address: adminWalletErc20.trim(), qr: adminQrErc20.trim() },
        },
        updated_at: new Date().toISOString()
      });
      toast({ title: "Global Gateway Updated", description: "Rerouting configuration has been propagated." });
      setIsGatewayOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsGatewayUpdating(false);
    }
  };

  const { data: rawUsers, loading: isUsersLoading } = useSupabaseQuery<Profile>("profiles", { order: ["created_at", { ascending: false }], limit: 100 });

  const { data: allTransactions, loading: isTransactionsLoading } = useSupabaseQuery<TradeTransaction>("trade_transactions", { order: ["initiation_time", { ascending: false }], limit: 100 });

  const { data: allWithdrawals, loading: isWithdrawalsLoading } = useSupabaseQuery<WithdrawalRequest>("withdrawals", { order: ["created_at", { ascending: false }], limit: 100 });

  const { data: allOffers, loading: isOffersLoading } = useSupabaseQuery<TraderOffer>("trader_buy_offers", { order: ["created_at", { ascending: false }], limit: 50 });

  const traderMetrics = useMemo(() => {
    const metrics: Record<string, { usdtReceived: number; moneyPaid: number; moneyToPay: number }> = {};
    
    // Initialize for all traders
    rawUsers?.forEach(u => {
      if (u.role === 'trader' || u.username === 'iamtrader') {
        metrics[u.id] = { usdtReceived: 0, moneyPaid: 0, moneyToPay: 0 };
      }
    });

    // Calculate USDT Received from successful trades
    allTransactions?.forEach((t: TradeTransaction) => {
      if (t.status === "Success" && t.traderId && metrics[t.traderId]) {
        metrics[t.traderId].usdtReceived += (t.cryptoAmount || 0);
      }
    });

    // Calculate Money Paid and Money to Pay from withdrawals
    allWithdrawals?.forEach((w: WithdrawalRequest) => {
      if (w.traderId && metrics[w.traderId]) {
        if (w.status === "Success") {
          metrics[w.traderId].moneyPaid += (w.amount || 0);
        } else if (w.status === "Pending") {
          metrics[w.traderId].moneyToPay += (w.amount || 0);
        }
      }
    });

    return metrics;
  }, [rawUsers, allTransactions, allWithdrawals]);

  const users = useMemo(() => {
    if (!rawUsers) return [];
    // Filter out soft-deleted/purged identities from the main list
    const activeUsers = rawUsers.filter((u: User) => u.status !== "purged");
    
    // Sort 'iamadmin' to the very top
    return [...activeUsers].sort((a: User, b: User) => {
      if (a.username === 'iamadmin') return -1;
      if (b.username === 'iamadmin') return 1;
      return 0;
    });
  }, [rawUsers]);

  const traders = useMemo(() => users.filter((u: User) => u.username === 'iamtrader' || u.role === "trader"), [users]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/auth/login");
    } else if (!isUserLoading && user && !isUserDataLoading && userData) {
      // Role-based redirection
      if (userData.role !== "admin" && userData.username !== "iamadmin") {
        if (userData.role === "trader" || userData.username === "iamtrader") {
          router.replace("/dashboard/trader");
        } else {
          router.replace("/dashboard/client");
        }
      }
    }
  }, [user, isUserLoading, isUserDataLoading, userData, router]);

  const handleLogout = async () => {
    sessionStorage.removeItem('static_user');
    await signOut();
    router.replace("/auth/login");
  };

  const handleProvisionTrader = async () => {
    if (!newTraderEmail || !newTraderUsername || !newTraderPass) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    const emailInput = newTraderEmail.trim().toLowerCase();

    // 1. Pre-Check Ledger: If identity exists in Profiles (even if purged), override with new password
    const existingInLedger = rawUsers?.find((u: Profile) => u.email === emailInput);
    if (existingInLedger) {
      setIsProvisioning(true);
      try {
        const { error } = await supabase.from("profiles").update({
          username: newTraderUsername.trim().toLowerCase().replace(/\s+/g, '_'),
          password_hash: newTraderPass, // Using password_hash field for simple override
          is_active: true,
          role: "trader"
        }).eq("id", existingInLedger.id);

        if (error) throw error;

        toast({ title: "Identity Re-Established", description: `Node ${newTraderUsername} restored with new access key.` });
        setNewTraderEmail("");
        setNewTraderUsername("");
        setNewTraderPass("admin123");
        setIsProvisionOpen(false);
        return;
      } catch (e) {
        console.error(e);
      } finally {
        setIsProvisioning(false);
      }
    }

    // 2. Standard Provision Flow (SignUp)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      toast({ variant: "destructive", title: "Invalid Protocol", description: "The provided email format is not recognized by the network." });
      return;
    }

    setIsProvisioning(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailInput,
        password: newTraderPass,
        options: {
          data: {
            username: newTraderUsername.trim().toLowerCase().replace(/\s+/g, '_'),
            role: "trader"
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("SignUp failed");

      // Profile is usually created via Trigger in Supabase, but let's do it manually if trigger isn't set
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: emailInput,
        username: newTraderUsername.trim().toLowerCase().replace(/\s+/g, '_'),
        password_hash: newTraderPass,
        is_active: true,
        role: "trader",
        created_at: new Date().toISOString()
      });

      if (profileError) throw profileError;

      toast({ 
        title: "Trader Identity Established", 
        description: `Identity provisioned for ${newTraderUsername}. You can now share the credentials.` 
      });
      
      setNewTraderEmail("");
      setNewTraderUsername("");
      setNewTraderPass("admin123");
      setIsProvisionOpen(false);
      
    } catch (e: any) { 
      console.error(e);
      toast({ variant: "destructive", title: "Activation Failed", description: e.message });
    } finally {
      setIsProvisioning(false); 
    }
  };

  const handleUpdateBranding = async (logo: "gold" | "original") => {
    setIsBrandingUpdating(true);
    try {
      const { error } = await supabase.from("global_settings").upsert({
        id: "default",
        branding: { selectedLogo: logo },
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setSelectedLogo(logo);
      toast({ title: "Branding Updated", description: "Global logo protocol updated." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally {
      setIsBrandingUpdating(false);
    }
  };

  const openEditDialog = (u: User) => {
    setEditingUser(u);
    setEditUsername(u.username || "");
    setEditEmail(u.email || "");
    setEditPass((u as any).password_hash || "");
    setIsEditOpen(true);
  };

  const handleUpdateIdentity = async () => {
    if (!editingUser) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      toast({ variant: "destructive", title: "Invalid Protocol", description: "The provided email format is not recognized by the network." });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.from("profiles").update({
        username: editUsername.trim().toLowerCase().replace(/\s+/g, '_'),
        email: editEmail.trim().toLowerCase(),
        password_hash: editPass
      }).eq("id", editingUser.id);

      if (error) throw error;

      toast({ title: "Identity Updated", description: "Ledger has been updated with new credentials." });
      setIsEditOpen(false);
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    const newActiveState = !u.isActive;
    const { error } = await supabase.from("profiles").update({ is_active: newActiveState }).eq("id", u.id);
    if (!error) {
      toast({ title: "Protocol Update", description: `${u.username} status toggled.` });
    }
  };

  const confirmDeleteUser = async () => {
    if (userToDelete) {
      const { error } = await supabase.from("profiles").update({ 
        is_active: false,
        purged_at: new Date().toISOString() 
      }).eq("id", userToDelete.id);

      if (!error) {
        toast({ title: "Identity Archived", description: `${userToDelete.username} removed from active ledger.` });
        setUserToDelete(null);
      }
    }
  };

  const handleApproveTrade = async (trade: TradeTransaction) => {
    try {
      // 1. Update Trade Status
      const { error: tradeError } = await supabase.from("trade_transactions").update({ status: "Success" }).eq("id", trade.id);
      if (tradeError) throw tradeError;

      // 2. Update Client Balance (Simulated increment)
      const { data: clientProfile } = await supabase.from("profiles").select("balance").eq("id", trade.clientId).single();
      const newClientBalance = (clientProfile?.balance || 0) + trade.fiatAmount;
      await supabase.from("profiles").update({ balance: newClientBalance }).eq("id", trade.clientId);

      // 3. Update Trader Balance
      if (trade.traderId) {
        const { data: traderProfile } = await supabase.from("profiles").select("balance").eq("id", trade.traderId).single();
        const newTraderBalance = (traderProfile?.balance || 0) + trade.fiatAmount;
        await supabase.from("profiles").update({ balance: newTraderBalance }).eq("id", trade.traderId);
      }

      toast({ title: "Trade Approved", description: "Funds released to client wallet by Admin." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Protocol Error", description: typeof e === 'string' ? e : "Failed to release funds." });
    }
  };

  const handleTradeStatusUpdate = async (trade: TradeTransaction, newStatus: string) => {
    try {
      if (newStatus === "Delete") {
        await supabase.from("trade_transactions").delete().eq("id", trade.id);
        toast({ title: "Transaction Purged", description: "Record removed from the ledger." });
      } else {
        await supabase.from("trade_transactions").update({ status: newStatus }).eq("id", trade.id);
        toast({ title: "Status Updated", description: `Trade status changed to ${newStatus} by Admin.` });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update trade status." });
    }
  };

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, newStatus: string) => {
    try {
      if (newStatus === "Success") {
        const { data: userProfile } = await supabase.from("profiles").select("balance").eq("id", withdrawal.userId).single();
        const currentBalance = userProfile?.balance || 0;
        
        if (currentBalance < withdrawal.amount) {
          throw "Insufficient Balance";
        }

        const { error: withdrawalError } = await supabase.from("withdrawals").update({ status: "Success", processed_at: new Date().toISOString() }).eq("id", withdrawal.id);
        if (withdrawalError) throw withdrawalError;

        await supabase.from("profiles").update({ balance: currentBalance - withdrawal.amount }).eq("id", withdrawal.userId);

        toast({ title: "Withdrawal Marked as Paid", description: "Balance deducted and status updated by Admin." });
      } else if (newStatus === "Delete") {
        await supabase.from("withdrawals").delete().eq("id", withdrawal.id);
        toast({ title: "Withdrawal Purged", description: "Record removed from the protocol." });
      } else {
        await supabase.from("withdrawals").update({ status: newStatus }).eq("id", withdrawal.id);
        toast({ title: "Status Updated", description: `Withdrawal status changed to ${newStatus} by Admin.` });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: typeof e === 'string' ? e : "Failed to update withdrawal status." });
    }
  };

  const resetOfferForm = () => {
    setOfferCrypto("USDT");
    setOfferNetwork("TRC20");
    setOfferFiat("INR");
    setOfferPrice("95.5");
    setOfferDisplayName("");
    setOfferWalletTrc20("");
    setOfferWalletBep20("");
    setOfferWalletErc20("");
    setOfferQrTrc20("");
    setOfferQrBep20("");
    setOfferQrErc20("");
    setOfferIconCid("");
    setOfferDescription("");
    setSelectedTraderId("");
  };

  const toggleNetwork = (net: string) => {
    const networks = offerNetwork.split(", ").filter(n => n !== "");
    if (networks.includes(net)) {
      const filtered = networks.filter(n => n !== net);
      setOfferNetwork(filtered.join(", "));
    } else {
      setOfferNetwork([...networks, net].join(", "));
    }
  };

  const handleOpenPosition = async () => {
    if (!offerPrice || (!selectedTraderId && !editingOfferId)) {
      toast({ variant: "destructive", title: "Missing Information", description: "Trader selection and price required." });
      return;
    }
    
    const trader = traders.find((t: User) => t.id === selectedTraderId);
    
    const offerData = {
      crypto_asset_id: offerCrypto.toUpperCase(),
      network: offerNetwork.toUpperCase(),
      fiat_currency: offerFiat.toUpperCase(),
      fixed_price_per_crypto: parseFloat(offerPrice),
      description: offerDescription,
      icon_cid: offerIconCid.trim(),
      wallet_address_trc20: offerWalletTrc20.trim(),
      wallet_address_bep20: offerWalletBep20.trim(),
      wallet_address_erc20: offerWalletErc20.trim(),
      wallet_qr_trc20: offerQrTrc20.trim(),
      wallet_qr_bep20: offerQrBep20.trim(),
      wallet_qr_erc20: offerQrErc20.trim(),
      status: "Active",
      trader_id: selectedTraderId,
      trader_username: trader?.username || "Verified Node",
      display_name: offerDisplayName.trim() || trader?.username || "Verified Node"
    };

    if (!editingOfferId) {
      const { error } = await supabase.from("trader_buy_offers").insert(offerData);
      if (!error) toast({ title: "Global Position Published" });
    } else {
      const { error } = await supabase.from("trader_buy_offers").update(offerData).eq("id", editingOfferId);
      if (!error) toast({ title: "Position Updated" });
    }

    setIsAddOfferOpen(false);
    setEditingOfferId(null);
    resetOfferForm();
  };

  const handleEditOffer = (off: TraderOffer) => {
    setEditingOfferId(off.id);
    setOfferCrypto(off.cryptoAssetId);
    setOfferNetwork(off.network);
    setOfferFiat(off.fiatCurrency);
    setOfferPrice(off.fixedPricePerCrypto.toString());
    setOfferDisplayName(off.displayName || "");
    setOfferDescription(off.description || "");
    setOfferIconCid(off.iconCid || "");
    setOfferWalletTrc20(off.walletAddressTrc20 || "");
    setOfferWalletBep20(off.walletAddressBep20 || "");
    setOfferWalletErc20(off.walletAddressErc20 || "");
    setOfferQrTrc20(off.walletQrTrc20 || "");
    setOfferQrBep20(off.walletQrBep20 || "");
    setOfferQrErc20(off.walletQrErc20 || "");
    setSelectedTraderId(off.traderId);
    setIsAddOfferOpen(true);
  };

  const handleDuplicateOffer = (off: TraderOffer) => {
    setEditingOfferId(null);
    setOfferCrypto(off.cryptoAssetId);
    setOfferNetwork(off.network);
    setOfferFiat(off.fiatCurrency);
    setOfferPrice(off.fixedPricePerCrypto.toString());
    setOfferDisplayName(off.displayName || "");
    setOfferDescription(off.description || "");
    setOfferIconCid(off.iconCid || "");
    setOfferWalletTrc20(off.walletAddressTrc20 || "");
    setOfferWalletBep20(off.walletAddressBep20 || "");
    setOfferWalletErc20(off.walletAddressErc20 || "");
    setOfferQrTrc20(off.walletQrTrc20 || "");
    setOfferQrBep20(off.walletQrBep20 || "");
    setOfferQrErc20(off.walletQrErc20 || "");
    setSelectedTraderId(off.traderId);
    setIsAddOfferOpen(true);
    toast({ title: "Draft Duplicated" });
  };

  const IPFSPreview = ({ cid, label, className }: { cid: string; label: string; className?: string }) => {
    const isUSDT = label?.toUpperCase().includes("USDT");
    const targetCid = isUSDT ? "bafybeicygbg5kw4b5wyzx7rsv7zen5qmgda6jkn57phoqhp67jji7fpefa" : cid;
    if (!targetCid || targetCid.trim().length < 10) return null;
    
    return (
      <div className={`flex flex-col items-center justify-center rounded-full shrink-0 relative group overflow-hidden ${className || 'w-16 h-16'} ${isUSDT ? '' : 'bg-white/5 border border-white/10'}`}>
        <Image src={`https://ipfs.io/ipfs/${targetCid.trim()}`} alt={label} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity scale-[0.8]" unoptimized />
      </div>
    );
  };

  if (isUserLoading || isUserDataLoading) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  // Strict Auth Guard: Only allow if user is authenticated and is an admin
  const isAuthorized = user && userData && (userData.role === "admin" || userData.username === "iamadmin" || userData.email === "iamadmin@connectcrypto.com");

  if (!isAuthorized) {
    return null; // Return nothing while redirecting in useEffect
  }

  const navItems = [
    { id: "ledger", label: "Participants", icon: Users },
    { id: "transactions", label: "Global Ledger", icon: CreditCard },
    { id: "withdrawals", label: "Withdrawals", icon: ArrowUpRight },
    { id: "offers", label: "Market Positions", icon: LayoutDashboard },
    { id: "branding", label: "Branding", icon: Settings },
    { id: "support", label: "Support", icon: Headset }
  ];

  return (
    <TooltipProvider>
    <div className="min-h-screen bg-transparent text-white flex flex-col font-body antialiased selection:bg-primary/30">
      <header className="border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl px-6 md:px-10 py-6 flex items-center justify-between shrink-0 z-[100]">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab("ledger")}>
          <div className="transition-transform group-hover:scale-110 duration-500">
            {selectedLogo === 'gold' ? (
              <USDTGoldLogo className="w-12 h-12" />
            ) : (
              <USDTOriginalLogo className="w-12 h-12" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-lg md:text-2xl uppercase tracking-tighter leading-none">ConnectRoot</span>
            <span className="text-[9px] text-primary font-bold uppercase tracking-[0.3em] leading-none mt-1.5">Authority Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden lg:block">
            <ISTTimer />
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-xl h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10 transition-all md:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsSignOutDialogOpen(true)} className="rounded-full h-12 w-12 border-white/10 bg-white/5 hover:bg-white/10 transition-all text-muted-foreground hover:text-red-500 hidden md:flex">
              <LogOut className="w-5 h-5" />
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
            <AlertDialogTitle className="text-2xl font-headline font-black uppercase tracking-tight text-white">Authority Shutdown</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed mt-2">
              Confirm termination of Root Authority session? All administrative locks will remain active.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-8">
            <AlertDialogCancel className="rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest border-white/10 bg-white/5 hover:bg-white/10 transition-all">Stay Logged In</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-500 hover:bg-red-600 rounded-2xl h-14 flex-1 text-[10px] font-bold uppercase tracking-widest text-white glow-primary transition-all">Commit Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="flex-1 app-scroll-area">
        <div className="p-6 md:p-10 lg:p-12 space-y-10 pb-40">
          <div className="space-y-3">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">Network Protected</span>
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl md:text-5xl font-headline font-black uppercase leading-none tracking-tighter italic">Market Integrity</h1>
              <p className="text-muted-foreground text-[10px] md:text-xs uppercase tracking-[0.3em] font-black opacity-60">
                Global Participant and Liquidity Hub Management.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 shrink-0 w-full lg:w-auto">
            <Button onClick={() => setIsProvisionOpen(true)} className="bg-primary h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] glow-primary text-white hover:scale-[1.02] transition-transform flex-1 md:flex-none">
              <UserPlus className="w-5 h-5 mr-2" /> Add Trader
            </Button>
            {activeTab === "offers" && (
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                <Button onClick={() => setIsGatewayOpen(true)} className={`h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex-1 md:flex-none ${isReroutingEnabled ? 'bg-amber-500/20 border border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'}`}>
                  <Globe className={`w-5 h-5 mr-2 ${isReroutingEnabled ? 'animate-pulse' : ''}`} /> Global Gateway: {isReroutingEnabled ? 'Active' : 'Standby'}
                </Button>
                <Button onClick={() => setIsAddOfferOpen(true)} className="bg-white/5 border border-white/10 h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all flex-1 md:flex-none">
                  <Plus className="w-5 h-5 mr-2" /> New Position
                </Button>
              </div>)}
          </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
          <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-auto flex w-full md:w-max overflow-x-auto no-scrollbar justify-start md:justify-center mx-auto">
            {navItems.map(item => (
              <TabsTrigger key={item.id} value={item.id} className="rounded-xl flex-shrink-0 px-8 md:px-10 py-4 font-black text-[10px] uppercase tracking-[0.2em] data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                <item.icon className="w-4 h-4 mr-2.5" /> {item.label}
              </TabsTrigger>
            ))}
          </TabsList>


          <TabsContent value="ledger">
            <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
              <CardHeader className="p-8 md:p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-headline font-black uppercase tracking-tight">Participant Ledger</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 mt-0.5">Verified Network Entities</p>
                  </div>
                </div>
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                  <Input 
                    placeholder="Search records..." 
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 text-[11px] font-bold tracking-widest focus:ring-primary/30" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                        <TableHeader>
                          <TableRow className="border-white/[0.05] bg-white/[0.02] hover:bg-transparent h-16">
                            <TableHead className="px-10 text-hierarchy-label">Identity</TableHead>
                            <TableHead className="text-hierarchy-label">Network Role</TableHead>
                            <TableHead className="text-hierarchy-label">Balance (INR)</TableHead>
                            <TableHead className="text-hierarchy-label">USDT Received</TableHead>
                            <TableHead className="text-hierarchy-label">Money Paid</TableHead>
                            <TableHead className="text-hierarchy-label">Money to Pay</TableHead>
                            <TableHead className="text-hierarchy-label">Status</TableHead>
                            <TableHead className="px-10 text-right text-hierarchy-label">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                    <TableBody>
                      {isUsersLoading ? (
                        <TableRow><TableCell colSpan={5} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                      ) : users?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-60 text-center opacity-20 uppercase font-black tracking-[0.3em] text-xs">No participants detected</TableCell></TableRow>
                      ) : users?.filter(u => u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map((u) => (
                        <TableRow key={u.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-20">
                          <TableCell className="px-10">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-black text-xs uppercase italic text-white group-hover:text-primary transition-colors">{u.username}</span>
                              <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{u.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="py-1 px-4 rounded-full text-[9px] font-black uppercase border-white/10 text-white/40 bg-white/5">
                              {u.username === 'iamtrader' || u.role === 'trader' ? 'Trader Node' : u.username === 'iamadmin' ? 'Network Admin' : 'Client Participant'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-black text-white text-sm italic group-hover:scale-105 transition-transform origin-left">
                             ₹{u.balance?.toLocaleString() || '0.00'}
                          </TableCell>
                          <TableCell className="font-black text-white/60 text-xs italic">
                            {(u.role === 'trader' || u.username === 'iamtrader') 
                              ? `${traderMetrics[u.id]?.usdtReceived.toLocaleString()} USDT`
                              : '--'}
                          </TableCell>
                          <TableCell className="font-black text-green-500/60 text-xs italic">
                            {(u.role === 'trader' || u.username === 'iamtrader') 
                              ? `₹${traderMetrics[u.id]?.moneyPaid.toLocaleString()}`
                              : '--'}
                          </TableCell>
                          <TableCell className="font-black text-amber-500/60 text-xs italic">
                            {(u.role === 'trader' || u.username === 'iamtrader') 
                              ? `₹${traderMetrics[u.id]?.moneyToPay.toLocaleString()}`
                              : '--'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border-none ${u.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {u.isActive ? 'Verified' : 'Locked'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-10 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(u)} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 border border-white/5">
                                    <Key className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Edit Identity</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setUserToDelete(u)} className="h-10 w-10 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 border border-white/5">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Purge Identity</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
               <CardHeader className="p-8 md:p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shrink-0">
                      <History className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-headline font-black uppercase tracking-tight">Global Trade Ledger</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 mt-0.5">Network Liquidity Flow Tracking</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-1.5 px-4 font-bold uppercase border-white/10 text-muted-foreground rounded-full bg-white/5">Real-time Feed</Badge>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow className="border-white/[0.05] bg-white/[0.02] hover:bg-transparent h-16">
                       <TableHead className="px-10 text-hierarchy-label">Reference</TableHead>
                       <TableHead className="text-hierarchy-label">Source / Node</TableHead>
                       <TableHead className="text-hierarchy-label">Asset Volume</TableHead>
                       <TableHead className="text-hierarchy-label">Fiat Value</TableHead>
                       <TableHead className="text-hierarchy-label">Status</TableHead>
                       <TableHead className="px-10 text-right text-hierarchy-label">Actions</TableHead>
                       <TableHead className="text-right px-10 text-hierarchy-label">Timestamp</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {isTransactionsLoading ? (
                       <TableRow><TableCell colSpan={7} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                     ) : !allTransactions?.length ? (
                       <TableRow><TableCell colSpan={7} className="h-60 text-center opacity-20 uppercase font-black tracking-[0.3em] text-xs italic">No network activity recorded</TableCell></TableRow>
                     ) : allTransactions.map((t) => (
                       <TableRow key={t.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-20">
                         <TableCell className="px-10 font-mono text-xs text-white/40 group-hover:text-white/90 transition-colors">
                           <span className="px-2 py-1 rounded bg-white/5 border border-white/5">#{t.id.slice(-6).toUpperCase()}</span>
                         </TableCell>
                         <TableCell>
                           <div className="flex flex-col gap-0.5">
                             <span className="text-[11px] font-black text-white uppercase italic tracking-tight">{t.clientUsername}</span>
                             <div className="flex items-center gap-1.5">
                               <span className="text-[9px] text-primary font-bold uppercase tracking-widest">Node: {t.traderUsername || "Verified"}</span>
                               {t.isRerouted && (
                                 <span className="text-[6px] text-amber-500 font-black uppercase tracking-tighter bg-amber-500/10 px-1 rounded-sm border border-amber-500/20">Rerouted</span>
                               )}
                             </div>
                           </div>
                         </TableCell>
                         <TableCell className="font-black text-white uppercase text-xs italic">{t.cryptoAmount} {t.cryptoAssetId}</TableCell>
                         <TableCell className="font-black text-primary uppercase text-xs italic group-hover:scale-105 transition-transform origin-left">
                           ₹{t.fiatAmount.toLocaleString()}
                           {t.isBonusApplied && (
                             <Badge className="ml-2 bg-primary/20 text-primary border-none text-[8px] font-black">+2%</Badge>
                           )}
                         </TableCell>
                         <TableCell>
                           <Badge className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border-none ${
                             t.status === "Success" ? "bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]" : 
                             t.status === "Paid" ? "bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : 
                             t.status === "Hold" ? "bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]" :
                             t.status === "KYC Required" ? "bg-blue-500/10 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]" :
                             "bg-primary/10 text-primary shadow-[0_0_10px_rgba(139,92,246,0.1)]"
                           }`}>{t.status}</Badge>
                         </TableCell>
                         <TableCell className="px-10 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {t.status !== "Success" && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleApproveTrade(t)} className="h-10 w-10 rounded-xl text-green-500 hover:bg-green-500/10 border border-white/5">
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Approve & Release</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleTradeStatusUpdate(t, "Hold")} className="h-10 w-10 rounded-xl text-amber-500 hover:bg-amber-500/10 border border-white/5">
                                        <Clock className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Put on Hold</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleTradeStatusUpdate(t, "KYC Required")} className="h-10 w-10 rounded-xl text-blue-500 hover:bg-blue-500/10 border border-white/5">
                                        <ShieldCheck className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Request KYC</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleTradeStatusUpdate(t, "Delete")} className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10 border border-white/5">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Purge Record</TooltipContent>
                              </Tooltip>
                            </div>
                         </TableCell>
                         <TableCell className="text-right px-10 text-[10px] opacity-30 group-hover:opacity-60 font-bold uppercase tracking-widest transition-opacity">
                           {new Date(t.initiationTime).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card className="glass-card border-none rounded-[3rem] overflow-hidden animate-in-scale">
               <CardHeader className="p-8 md:p-10 border-b border-white/[0.05] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 shrink-0">
                      <ArrowUpRight className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-headline font-black uppercase tracking-tight">Withdrawal Management</h2>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60 mt-0.5">Capital Outflow Control Hub</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] py-1.5 px-4 font-bold uppercase border-white/10 text-muted-foreground rounded-full bg-white/5">Institutional Payouts</Badge>
               </CardHeader>
               <CardContent className="p-0 overflow-x-auto">
                 <Table>
                   <TableHeader>
                     <TableRow className="border-white/[0.05] bg-white/[0.02] hover:bg-transparent h-16">
                       <TableHead className="px-10 text-hierarchy-label">ID</TableHead>
                       <TableHead className="text-hierarchy-label">Participant</TableHead>
                       <TableHead className="text-hierarchy-label">Value (INR)</TableHead>
                       <TableHead className="text-hierarchy-label">Gateway Endpoint</TableHead>
                       <TableHead className="text-hierarchy-label">Status</TableHead>
                       <TableHead className="px-10 text-right text-hierarchy-label">Actions</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {isWithdrawalsLoading ? (
                       <TableRow><TableCell colSpan={6} className="h-60 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                     ) : !allWithdrawals?.length ? (
                       <TableRow><TableCell colSpan={6} className="h-60 text-center opacity-20 uppercase font-black tracking-[0.3em] text-xs italic">No withdrawal requests found</TableCell></TableRow>
                     ) : allWithdrawals.map((w) => (
                       <TableRow key={w.id} className="border-white/[0.05] hover:bg-white/[0.03] transition-all group h-20">
                         <TableCell className="px-10 font-mono text-xs text-white/40 group-hover:text-white/90 transition-colors">
                            <span className="px-2 py-1 rounded bg-white/5 border border-white/5">#{w.id.slice(-6).toUpperCase()}</span>
                         </TableCell>
                         <TableCell className="font-black text-white uppercase text-xs italic">{w.username}</TableCell>
                         <TableCell className="font-black text-primary uppercase text-sm italic group-hover:scale-105 transition-transform origin-left">₹{w.amount?.toLocaleString()}</TableCell>
                         <TableCell className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                           <div className="flex flex-col gap-0.5">
                             <span>{w.gatewayDetails?.type} • {w.gatewayDetails?.name}</span>
                             <span className="text-[9px] text-primary/60 font-mono tracking-tighter opacity-80 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 w-fit">
                               {w.gatewayDetails?.detail}
                             </span>
                           </div>
                         </TableCell>
                         <TableCell>
                           <Badge className={`px-3 py-1 text-[10px] font-black uppercase rounded-full border-none ${
                             w.status === "Success" ? "bg-green-500/10 text-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]" : 
                             w.status === "Pending" ? "bg-amber-500/10 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]" : 
                             w.status === "Hold" ? "bg-red-500/10 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]" :
                             w.status === "Verification Required" ? "bg-purple-500/10 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.1)]" :
                             "bg-primary/10 text-primary shadow-primary/10"
                           }`}>{w.status}</Badge>
                         </TableCell>
                         <TableCell className="px-10 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {w.status !== "Success" && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleWithdrawalAction(w, "Success")} className="h-10 w-10 rounded-xl text-green-500 hover:bg-green-500/10 border border-white/5">
                                        <CheckCircle className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Mark as Paid</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleWithdrawalAction(w, "Hold")} className="h-10 w-10 rounded-xl text-amber-500 hover:bg-amber-500/10 border border-white/5">
                                        <Clock className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Put on Hold</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleWithdrawalAction(w, "Verification Required")} className="h-10 w-10 rounded-xl text-purple-500 hover:bg-purple-500/10 border border-white/5">
                                        <ShieldCheck className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Request KYC</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => handleWithdrawalAction(w, "Delete")} className="h-10 w-10 rounded-xl text-red-500 hover:bg-red-500/10 border border-white/5">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent className="bg-black/90 border-white/10 text-[9px] uppercase font-bold">Purge Record</TooltipContent>
                              </Tooltip>
                            </div>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </CardContent>
            </Card>
          </TabsContent>


          <TabsContent value="offers">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {isOffersLoading ? (
                <div className="col-span-full py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
              ) : !allOffers?.length ? (
                <div className="col-span-full py-20 text-center opacity-20 font-bold uppercase tracking-widest text-[10px]">No market positions active</div>
              ) : allOffers.map((off) => (
                <Card key={off.id} className="glass-card border-none rounded-[1.5rem] p-4 flex flex-col min-h-[180px] justify-between space-y-3 hover:border-primary/20 transition-all group/card relative">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {off.iconCid ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 shadow-inner shrink-0">
                            <Image src={`https://ipfs.io/ipfs/${off.iconCid}`} alt={off.cryptoAssetId} fill className="object-cover" unoptimized />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4 text-muted-foreground opacity-30" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <p className="text-[8px] text-primary font-bold uppercase tracking-[0.1em] truncate mb-0.5">
                            {off.displayName || off.traderUsername || 'Verified Node'}
                          </p>
                          <p className="font-headline font-black text-base uppercase tracking-tighter text-white/90 leading-none truncate">
                            {off.cryptoAssetId}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover/card:opacity-100 transition-all duration-300 translate-x-1 group-hover/card:translate-x-0">
                        <Button variant="ghost" size="icon" onClick={() => handleEditOffer(off)} className="hover:bg-primary/10 h-6 w-6 rounded-md transition-colors"><Edit2 className="w-3 h-3 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDuplicateOffer(off)} className="hover:bg-primary/10 h-6 w-6 rounded-md transition-colors"><Copy className="w-3 h-3 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDocumentNonBlocking(doc(db, "trader_buy_offers", off.id))} className="hover:bg-red-500/10 h-6 w-6 rounded-md transition-colors"><Trash2 className="w-3 h-3 text-red-500" /></Button>
                      </div>
                    </div>
                    {off.description && (
                      <div className="px-1 border-l border-primary/20 ml-1">
                        <p className="text-[8px] text-muted-foreground line-clamp-2 leading-relaxed italic pl-2 opacity-60">
                          &quot;{off.description}&quot;
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[6px] text-muted-foreground font-bold uppercase tracking-widest mb-0.5">Fixed Rate</span>
                      <p className="text-sm font-headline font-bold text-primary leading-none">{off.fixedPricePerCrypto} <span className="text-[8px] opacity-50">{off.fiatCurrency}</span></p>
                    </div>
                    <Badge variant="outline" className="text-[6px] py-0 px-1.5 border-white/5 text-muted-foreground uppercase font-bold tracking-tighter scale-90">
                      {off.status || 'Active'}
                    </Badge>
                  </div>
                </Card>
              ))}
              <button onClick={() => { resetOfferForm(); setIsAddOfferOpen(true); }} className="border-2 border-dashed border-white/5 rounded-[1.5rem] h-[180px] flex flex-col items-center justify-center gap-2 hover:border-primary/20 hover:bg-white/[0.02] transition-all group">
                 <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                 <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">Global Position</span>
              </button>
            </div>
          </TabsContent>

          <TabsContent value="branding">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              <div className="text-center space-y-4 mb-12">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 glow-primary">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-headline font-black uppercase tracking-tighter text-white">Branding Configuration</h2>
                <p className="text-primary text-[8px] uppercase tracking-[0.4em] font-bold">Global Visual Identity Protocols</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Gold Logo Option */}
                <Card 
                  className={`glass-card border-2 rounded-[2.5rem] p-10 space-y-8 cursor-pointer transition-all duration-500 group ${selectedLogo === 'gold' ? 'border-primary bg-primary/5 shadow-[0_0_40px_rgba(139,92,246,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                  onClick={() => handleUpdateBranding('gold')}
                >
                  <div className="flex flex-col items-center gap-6">
                    <USDTGoldLogo className="w-48 h-48 drop-shadow-[0_0_30px_rgba(253,185,51,0.3)] group-hover:scale-105 transition-transform duration-700" />
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-headline font-black uppercase tracking-widest text-white italic">USDT GOLD</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Institutional Premium Aesthetic</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button 
                      className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${selectedLogo === 'gold' ? 'bg-primary text-white glow-primary' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'}`}
                      disabled={isBrandingUpdating || selectedLogo === 'gold'}
                    >
                      {selectedLogo === 'gold' ? 'ACTIVE PROTOCOL' : 'SELECT IDENTITY'}
                    </Button>
                  </div>
                </Card>

                {/* Original Logo Option */}
                <Card 
                  className={`glass-card border-2 rounded-[2.5rem] p-10 space-y-8 cursor-pointer transition-all duration-500 group ${selectedLogo === 'original' ? 'border-[#26A17B] bg-[#26A17B]/5 shadow-[0_0_40px_rgba(38,161,123,0.1)]' : 'border-white/5 hover:border-white/20'}`}
                  onClick={() => handleUpdateBranding('original')}
                >
                  <div className="flex flex-col items-center gap-6">
                    <USDTOriginalLogo className="w-48 h-48 drop-shadow-[0_0_30px_rgba(38,161,123,0.3)] group-hover:scale-105 transition-transform duration-700" />
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-headline font-black uppercase tracking-widest text-white italic">USDT ORIGINAL</h3>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Standard Network Authenticity</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <Button 
                      className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all ${selectedLogo === 'original' ? 'bg-[#26A17B] text-white shadow-[0_0_30px_rgba(38,161,123,0.4)]' : 'bg-white/5 text-white/40 border border-white/10 hover:text-white'}`}
                      disabled={isBrandingUpdating || selectedLogo === 'original'}
                    >
                      {selectedLogo === 'original' ? 'ACTIVE PROTOCOL' : 'SELECT IDENTITY'}
                    </Button>
                  </div>
                </Card>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 mt-12">
                <div className="flex items-start gap-4">
                  <ShieldAlert className="w-6 h-6 text-primary shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-white">Protocol Synchronicity</h4>
                    <p className="text-[10px] text-white/40 leading-relaxed font-bold uppercase tracking-widest">
                      Changing the visual identity will instantly synchronize across all participant nodes (Traders, Agents, and Clients). Ensure branding alignment before committing.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support">
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              <div className="text-center space-y-4 mb-12">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 glow-primary">
                  <Headset className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-headline font-black uppercase tracking-tighter text-white">Institutional Support</h2>
                <p className="text-primary text-[8px] uppercase tracking-[0.4em] font-bold">24/7 Global Assistance Hub</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">Email Authority</h3>
                    <p className="text-xs font-mono text-primary truncate">support@connectcrypto.com</p>
                  </div>
                </Card>

                <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">Telegram Channels</h3>
                    <p className="text-xs font-mono text-primary truncate">@connectcrypto</p>
                    <p className="text-[8px] font-mono text-muted-foreground">Support: @connectcrypto_support</p>
                  </div>
                </Card>

                <Card className="glass-card border-none rounded-[2rem] p-6 space-y-4 hover:border-primary/20 transition-all group">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-white mb-1">WhatsApp Direct</h3>
                    <p className="text-xs font-mono text-primary truncate">+91 9{Math.floor(Math.random() * 900000000 + 100000000)}</p>
                  </div>
                </Card>
              </div>

              <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-6 border-l-4 border-l-primary mt-12">
                <div className="flex items-center gap-4">
                  <Clock className="w-8 h-8 text-primary" />
                  <h3 className="text-xl font-headline font-bold uppercase text-white">Settlement SLA</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Crypto Confirmation</p>
                    <p className="text-2xl font-headline font-bold text-white">15 MINUTES</p>
                    <p className="text-[7px] text-muted-foreground mt-2 italic uppercase">Protocol allows 15m for blockchain consensus before manual intervention.</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Fiat Withdrawal</p>
                    <p className="text-2xl font-headline font-bold text-white">30 MINUTES</p>
                    <p className="text-[7px] text-muted-foreground mt-2 italic uppercase">Nodes must process payout requests within the 30m institutional window.</p>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Global Offer Dialog */}
        <Dialog open={isAddOfferOpen} onOpenChange={(open) => {
          setIsAddOfferOpen(open);
          if (!open) {
            setEditingOfferId(null);
            resetOfferForm();
          }
        }}>
          <DialogContent className="glass-card border-white/10 rounded-[2.5rem] p-8 max-w-lg">
            <DialogHeader><DialogTitle className="text-xl font-bold uppercase text-white">{editingOfferId ? "Edit Global Position" : "Publish Global Position"}</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
              {!editingOfferId && (
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Assign to Trader</Label>
                  <select className="w-full bg-black/60 border border-white/10 rounded-xl h-12 px-4 text-sm text-white outline-none" value={selectedTraderId} onChange={e => setSelectedTraderId(e.target.value)}>
                    <option value="">Select a Trader Node</option>
                    {traders.map(t => (
                      <option key={t.id} value={t.id}>{t.username} ({t.email})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Crypto Asset</Label>
                  <Input value={offerCrypto} onChange={e => setOfferCrypto(e.target.value.toUpperCase())} placeholder="USDT" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Network Assets</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {["TRC20", "BEP20", "ERC20"].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => toggleNetwork(net)}
                        className={`h-12 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                          offerNetwork.includes(net) 
                            ? 'bg-primary border-primary text-white glow-primary' 
                            : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Display Name (Visible to Users)</Label>
                <Input value={offerDisplayName} onChange={e => setOfferDisplayName(e.target.value)} placeholder="e.g. Institutional Liquidity Hub" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Fiat Currency</Label>
                  <Input value={offerFiat} onChange={e => setOfferFiat(e.target.value.toUpperCase())} placeholder="INR" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Fixed Price Rate</Label>
                  <Input type="number" step="0.01" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[9px] uppercase font-bold text-primary tracking-[0.2em] mb-2">Institutional Wallets (3 Networks)</p>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">TRC20 Wallet Address</Label>
                  <Input value={offerWalletTrc20} onChange={e => setOfferWalletTrc20(e.target.value)} placeholder="T..." className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                  <div className="flex gap-2 mt-1">
                    <Input value={offerQrTrc20} onChange={e => setOfferQrTrc20(e.target.value)} placeholder="TRC20 QR CID" className="bg-white/5 border-white/10 h-10 rounded-xl font-mono text-[10px] focus:ring-primary/50 flex-1" />
                    <IPFSPreview cid={offerQrTrc20} label="TRC20 QR" className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">BEP20 Wallet Address</Label>
                  <Input value={offerWalletBep20} onChange={e => setOfferWalletBep20(e.target.value)} placeholder="0x..." className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                  <div className="flex gap-2 mt-1">
                    <Input value={offerQrBep20} onChange={e => setOfferQrBep20(e.target.value)} placeholder="BEP20 QR CID" className="bg-white/5 border-white/10 h-10 rounded-xl font-mono text-[10px] focus:ring-primary/50 flex-1" />
                    <IPFSPreview cid={offerQrBep20} label="BEP20 QR" className="w-10 h-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">ERC20 Wallet Address</Label>
                  <Input value={offerWalletErc20} onChange={e => setOfferWalletErc20(e.target.value)} placeholder="0x..." className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                  <div className="flex gap-2 mt-1">
                    <Input value={offerQrErc20} onChange={e => setOfferQrErc20(e.target.value)} placeholder="ERC20 QR CID" className="bg-white/5 border-white/10 h-10 rounded-xl font-mono text-[10px] focus:ring-primary/50 flex-1" />
                    <IPFSPreview cid={offerQrErc20} label="ERC20 QR" className="w-10 h-10" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Asset Icon CID (IPFS)</Label>
                <div className="flex gap-2">
                  <Input value={offerIconCid} onChange={e => setOfferIconCid(e.target.value)} placeholder="Icon CID" className="bg-white/5 border-white/10 h-12 rounded-xl font-mono text-xs focus:ring-primary/50 flex-1" />
                  <IPFSPreview cid={offerIconCid} label="Asset Icon" className="w-12 h-12" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Terms & Description</Label>
                <textarea value={offerDescription} onChange={e => setOfferDescription(e.target.value)} placeholder="Add your trading terms..." className="w-full bg-white/5 border border-white/10 rounded-xl min-h-[100px] p-4 text-sm focus:ring-primary/50 outline-none" />
              </div>
            </div>
            <DialogFooter><Button onClick={handleOpenPosition} className="w-full h-14 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary">Confirm & Publish</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Provision Dialog */}
        <Dialog open={isProvisionOpen} onOpenChange={setIsProvisionOpen}>
          <DialogContent className="glass-card border-none rounded-[2.5rem] p-10 max-w-lg">
            <DialogHeader className="space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/20">
                <UserPlus className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-headline font-bold uppercase tracking-tighter">Add New Trader</DialogTitle>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Assign a new node to the protocol.</p>
              </div>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Official Email</Label>
                <Input value={newTraderEmail} onChange={e => setNewTraderEmail(e.target.value)} placeholder="ravi@example.com" className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Public Alias</Label>
                <Input value={newTraderUsername} onChange={e => setNewTraderUsername(e.target.value)} placeholder="ravi_sharma" className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Access Phrase</Label>
                <Input value={newTraderPass} onChange={e => setNewTraderPass(e.target.value)} placeholder="admin123" className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleProvisionTrader} className="w-full h-14 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary hover:scale-[1.01] transition-all" disabled={isProvisioning}>
                {isProvisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Commit Provision"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Identity Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="glass-card border-white/10 rounded-[2.5rem] p-10 max-w-lg">
            <DialogHeader><DialogTitle className="text-xl font-bold uppercase text-white">Edit Identity</DialogTitle></DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Identity Status</Label>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] font-bold uppercase flex-1">{editingUser?.isActive ? "Identity Active" : "Identity Locked"}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => editingUser && handleToggleStatus(editingUser)}
                    className={`h-8 px-4 rounded-lg text-[8px] font-bold uppercase ${editingUser?.isActive ? 'text-red-500 hover:bg-red-500/10' : 'text-green-500 hover:bg-green-500/10'}`}
                  >
                    {editingUser?.isActive ? "Lock Node" : "Unlock Node"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Public Alias</Label>
                <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50 text-[10px] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Official Email</Label>
                <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50 text-[10px] font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-bold uppercase opacity-50 ml-1">Access Phrase (Static Override)</Label>
                <Input value={editPass} onChange={e => setEditPass(e.target.value)} className="bg-white/5 border-white/10 h-14 rounded-xl focus:ring-primary/50 text-[10px] font-bold text-primary" />
                <p className="text-[7px] uppercase tracking-widest opacity-40 ml-1 italic">This override allows users to login using this phrase if Identity Gate fails.</p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateIdentity} className="w-full h-14 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary hover:scale-[1.01] transition-all" disabled={isUpdating}>
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Identity Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Alert */}
        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent className="glass-card border-white/10 rounded-[2rem]">
            <AlertDialogHeader>
              <AlertDialogTitle className="uppercase font-headline font-bold">Verify Identity Purge</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                Are you certain you want to remove <span className="text-primary">{userToDelete?.username}</span> from the network protocol? This action is permanent.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl font-bold text-[9px] uppercase tracking-widest">Abort</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive text-white rounded-xl font-bold text-[9px] uppercase tracking-widest">Purge Protocol</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Global Gateway / Rerouting Dialog */}
        <Dialog open={isGatewayOpen} onOpenChange={setIsGatewayOpen}>
          <DialogContent className="glass-card border-white/10 rounded-[2.5rem] max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-2xl font-headline font-bold uppercase flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Global Gateway Protocol
              </DialogTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Configure global liquidity rerouting and master wallet overrides.</p>
            </DialogHeader>

            <div className="space-y-8 py-6">
              {/* Master Reroute Toggle */}
              <div className={`p-6 rounded-3xl border transition-all flex items-center justify-between gap-6 ${isReroutingEnabled ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/10 opacity-60'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className={`w-4 h-4 ${isReroutingEnabled ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <h3 className="font-bold uppercase text-xs tracking-tight">Master Reroute Override</h3>
                  </div>
                  <p className="text-[8px] uppercase tracking-widest opacity-70 leading-relaxed max-w-xs">
                    When active, all payments will route to the Institutional Global Gateway. Regardless of this state, the trade will always be assigned to the original Trader Node whose offer was selected.
                  </p>
                </div>
                <Button 
                  onClick={async () => {
                    const newState = !isReroutingEnabled;
                    setIsReroutingEnabled(newState);
                    try {
                      await setDoc(doc(db, "settings", "global_gateway"), {
                        isReroutingEnabled: newState,
                        updatedAt: new Date().toISOString(),
                        updatedBy: user?.email
                      }, { merge: true });
                      toast({ title: `Gateway ${newState ? 'Activated' : 'Standby'}`, description: `Institutional rerouting is now ${newState ? 'live' : 'disabled'}.` });
                    } catch (e) {
                      console.error(e);
                      toast({ variant: "destructive", title: "Protocol Update Failed" });
                      setIsReroutingEnabled(!newState); // Rollback
                    }
                  }}
                  className={`h-12 px-8 rounded-xl font-bold uppercase text-[9px] tracking-widest transition-all ${isReroutingEnabled ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:bg-amber-600' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                >
                  <Power className="w-3.5 h-3.5 mr-2" />
                  {isReroutingEnabled ? 'Protocol Active' : 'Protocol Standby'}
                </Button>
              </div>

              {/* Wallet Configuration Grid */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                {/* TRC20 Configuration */}
                <div className="space-y-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">TRC20 (USDT/TRX) Network</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[8px] font-bold uppercase opacity-40 ml-1 tracking-widest">Admin Wallet Address</Label>
                      <Input 
                        placeholder="Enter TRC20 Address..." 
                        value={adminWalletTrc20} 
                        onChange={e => setAdminWalletTrc20(e.target.value)} 
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-mono tracking-tight focus:ring-primary/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[8px] font-bold uppercase opacity-40 ml-1 tracking-widest">Dedicated QR Content (IPFS CID)</Label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                          <Input 
                            placeholder="Enter TRC20 QR CID..." 
                            value={adminQrTrc20} 
                            onChange={e => setAdminQrTrc20(e.target.value)} 
                            className="pl-12 bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-mono tracking-tight focus:ring-primary/50" 
                          />
                        </div>
                        <IPFSPreview cid={adminQrTrc20} label="TRC20 QR" className="h-12 w-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BEP20 Configuration */}
                <div className="space-y-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">BEP20 (USDT/BNB) Network</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[8px] font-bold uppercase opacity-40 ml-1 tracking-widest">Admin Wallet Address</Label>
                      <Input 
                        placeholder="Enter BEP20 Address..." 
                        value={adminWalletBep20} 
                        onChange={e => setAdminWalletBep20(e.target.value)} 
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-mono tracking-tight focus:ring-primary/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[8px] font-bold uppercase opacity-40 ml-1 tracking-widest">Dedicated QR Content (IPFS CID)</Label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                          <Input 
                            placeholder="Enter BEP20 QR CID..." 
                            value={adminQrBep20} 
                            onChange={e => setAdminQrBep20(e.target.value)} 
                            className="pl-12 bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-mono tracking-tight focus:ring-primary/50" 
                          />
                        </div>
                        <IPFSPreview cid={adminQrBep20} label="BEP20 QR" className="h-12 w-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ERC20 Configuration */}
                <div className="space-y-4 p-6 rounded-3xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest">ERC20 (USDT/ETH) Network</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[8px] font-bold uppercase opacity-40 ml-1 tracking-widest">Admin Wallet Address</Label>
                      <Input 
                        placeholder="Enter ERC20 Address..." 
                        value={adminWalletErc20} 
                        onChange={e => setAdminWalletErc20(e.target.value)} 
                        className="bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-mono tracking-tight focus:ring-primary/50" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[8px] font-bold uppercase opacity-40 ml-1 tracking-widest">Dedicated QR Content (IPFS CID)</Label>
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <QrCode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" />
                          <Input 
                            placeholder="Enter ERC20 QR CID..." 
                            value={adminQrErc20} 
                            onChange={e => setAdminQrErc20(e.target.value)} 
                            className="pl-12 bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-mono tracking-tight focus:ring-primary/50" 
                          />
                        </div>
                        <IPFSPreview cid={adminQrErc20} label="ERC20 QR" className="h-12 w-12 rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-white/5">
              <Button 
                onClick={handleUpdateGlobalGateway} 
                className="w-full h-14 bg-primary rounded-2xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary hover:scale-[1.01] transition-all disabled:opacity-50"
                disabled={isGatewayUpdating}
              >
                {isGatewayUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <SwitchCamera className="w-4 h-4 mr-2" />
                    Commit Gateway Configuration
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </main>
  </div>
  </TooltipProvider>
  );
}
