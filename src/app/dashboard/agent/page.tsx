'use client';

import React, { useState, useMemo, useEffect } from "react";
import { 
  LayoutDashboard, 
  Wallet as WalletIcon, 
  History, 
  Settings, 
  ShieldCheck, 
  Zap, 
  Plus, 
  Loader2, 
  Landmark, 
  UserCircle, 
  CreditCard, 
  ExternalLink, 
  Copy, 
  Menu, 
  X, 
  Coins, 
  History as HistoryIcon, 
  Edit2, 
  Headset, 
  Link2,
  Percent,
  Users,
  Share2,
  Rocket,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Megaphone
} from "lucide-react";
import { collection, query, where, doc, getDoc, updateDoc, orderBy, onSnapshot, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ISTTimer } from "@/components/ui/ist-timer";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { agentAICommunicationAssistant } from "@/ai/flows/agent-ai-communication-assistant";
import { USDTGoldLogo } from "@/components/logos/USDTGoldLogo";
import { USDTOriginalLogo } from "@/components/logos/USDTOriginalLogo";

const MARKETING_TEMPLATES = [
  {
    title: "Arbitrage Opportunity (Binance)",
    content: "🚀 Earn with Crypto Arbitrage! Buy USDT on Binance and sell it on ConnectCrypto at a premium. Fast, secure, and profitable. Get started here: {link}",
    type: "Arbitrage"
  },
  {
    title: "Secure P2P Focus",
    content: "🔒 Tired of P2P scams? Join ConnectCrypto, the most secure P2P trading platform with institutional-grade protection. Register now: {link}",
    type: "Security"
  },
  {
    title: "WhatsApp Quick Pitch",
    content: "Hey! I've been using ConnectCrypto for P2P trading. It's much faster than other exchanges. Check it out: {link}",
    type: "WhatsApp"
  },
  {
    title: "Professional Invite (LinkedIn/Email)",
    content: "I invite you to join ConnectCrypto, an institutional-grade P2P trading network. Experience high liquidity and competitive exchange rates. Sign up here: {link}",
    type: "Professional"
  },
  {
    title: "Passive Income Focus",
    content: "💰 Build your passive income stream! Refer traders to ConnectCrypto and earn commissions on every trade they complete. Start here: {link}",
    type: "Income"
  },
  {
    title: "Telegram Community Pitch",
    content: "Join the next generation of P2P trading. Secure settlements, high trust, and 24/7 support. Join my network: {link}",
    type: "Community"
  },
  {
    title: "High Liquidity Node",
    content: "Need to sell large volumes of USDT? Connect with our institutional liquidity nodes for instant settlements. Register: {link}",
    type: "Liquidity"
  },
  {
    title: "Step-by-Step Guide",
    content: "Ready to trade? 1. Sign up: {link} 2. Verify KYC 3. Start selling USDT at the best market rates!",
    type: "Guide"
  },
  {
    title: "Comparison Pitch",
    content: "Stop selling USDT at low rates on standard exchanges. ConnectCrypto offers premium rates for verified traders. Sign up: {link}",
    type: "Comparison"
  },
  {
    title: "Premium USDT Sell",
    content: "Exclusive for high-volume traders: Sell your USDT at a 1-2% premium over standard exchange rates on ConnectCrypto. Link: {link}",
    type: "Premium"
  },
  {
    title: "Fast Settlement Focus",
    content: "No more waiting for hours. Experience instant INR settlements for your USDT trades on ConnectCrypto. Try it now: {link}",
    type: "Fast"
  },
  {
    title: "Institutional Access",
    content: "Get access to institutional-grade P2P trading infrastructure. Secure your account today: {link}",
    type: "Institutional"
  }
];

const PROFIT_STRATEGIES = [
  {
    title: "Binance Arbitrage",
    description: "Buy USDT on Binance Spot or P2P when rates are low (e.g., ₹88-90) and sell it on ConnectCrypto where institutional buyers pay a premium (e.g., ₹92-95).",
    icon: TrendingUp
  },
  {
    title: "Stablecoin Liquidity",
    description: "Instead of low-yield staking, provide liquidity on ConnectCrypto to earn from the spread between buy and sell orders.",
    icon: Coins
  },
  {
    title: "Referral Network Growth",
    description: "Focus on referring high-volume traders. You earn a percentage of every trade they make, creating a permanent passive income source.",
    icon: Users
  },
  {
    title: "Institutional Partnership",
    description: "Work with your assigned trader to manage bulk liquidity requests and earn additional management bonuses for high-volume periods.",
    icon: ShieldCheck
  }
];

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("referrals");
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  
  // AI Assistant States
  const [aiMessageType, setAiMessageType] = useState<"recruitment" | "onboarding" | "support">("recruitment");
  const [aiClientUsername, setAiClientUsername] = useState("");
  const [aiAdditionalContext, setAiAdditionalContext] = useState("");
  const [aiGeneratedMessage, setAiGeneratedMessage] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Offer Form States
  const [offerCrypto, setOfferCrypto] = useState("USDT");
  const [offerNetwork, setOfferNetwork] = useState<string[]>(["TRC20"]);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerDisplayName, setOfferDisplayName] = useState("");
  const [offerFiat, setOfferFiat] = useState("INR");
  const [offerDescription, setOfferDescription] = useState("");

  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const brandingDocRef = useMemoFirebase(() => doc(db, "settings", "branding"), [db]);
  const { data: brandingSettings } = useDoc(brandingDocRef);

  const [userData, setUserData] = useState<any>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  const [traderData, setTraderData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), async (uDoc) => {
        if (!uDoc.exists()) {
          // If the document doesn't exist yet, check if it's a static user
          if ((user as any).isStatic) {
            const cleanDisplayName = (user.displayName || 'AGENT').split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
            setUserData({
              id: user.uid,
              username: cleanDisplayName,
              email: user.email,
              role: (user as any).role || 'agent',
              isActive: true,
              referralCode: cleanDisplayName.toUpperCase() + Math.floor(100 + Math.random() * 899)
            });
          }
          setIsUserDataLoading(false);
          return;
        }
        const data = uDoc.data();
        
        // Sanitize Referral Code if it's an email or missing
        if (!data.referralCode || data.referralCode.includes("@")) {
          const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let newRefCode = "";
          for (let i = 0; i < 8; i++) {
            newRefCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          await updateDoc(doc(db, "users", user.uid), { referralCode: newRefCode });
          data.referralCode = newRefCode;
        }

        setUserData(data);
        setIsUserDataLoading(false);
        
        if (data?.traderId) {
          const tDoc = await getDoc(doc(db, "users", data.traderId));
          setTraderData(tDoc.data());
        }
      });
      return () => unsub();
    } else if (!isUserLoading) {
      setIsUserDataLoading(false);
    }
  }, [user, isUserLoading, db]);

  // Referred Users Query
  const referredUsersQuery = useMemoFirebase(() => user ? query(collection(db, "users"), where("agentId", "==", user.uid), limit(50)) : null, [db, user?.uid]);
  const { data: referredUsers } = useCollection(referredUsersQuery);

  // Referred Users Trades Query
  const referredTradesQuery = useMemoFirebase(() => user ? query(collection(db, "trade_transactions"), where("agentId", "==", user.uid), orderBy("initiationTime", "desc"), limit(100)) : null, [db, user?.uid]);
  const { data: referredTrades } = useCollection(referredTradesQuery);

  // My Offers Query (Promotional Positions)
  const myOffersQuery = useMemoFirebase(() => user ? query(collection(db, "trader_buy_offers"), where("agentId", "==", user.uid), orderBy("createdAt", "desc"), limit(50)) : null, [db, user?.uid]);
  const { data: myOffers } = useCollection(myOffersQuery);

  const referralLink = useMemo(() => {
    if (typeof window !== 'undefined' && userData?.referralCode) {
      return `${window.location.origin}/auth/register?ref=${userData.referralCode}`;
    }
    return "";
  }, [userData?.referralCode]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace("/auth/login");
    } else if (!isUserLoading && user && !isUserDataLoading && userData) {
      if (userData.role !== "agent" && userData.role !== "admin") {
        router.replace("/dashboard/client");
      }
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  const handleOpenPosition = async () => {
    if (!user || !traderData || !offerPrice) return;
    
    const offerData: any = {
      traderId: userData.traderId,
      traderUsername: traderData.username,
      agentId: user.uid,
      agentUsername: userData.username,
      displayName: offerDisplayName.trim() || userData.username,
      cryptoAssetId: offerCrypto.toUpperCase(),
      network: offerNetwork.join(", ").toUpperCase(),
      fiatCurrency: offerFiat.toUpperCase(),
      fixedPricePerCrypto: parseFloat(offerPrice),
      description: offerDescription,
      // Use trader's wallets
      walletAddressTrc20: traderData.walletAddressTrc20 || "",
      walletAddressBep20: traderData.walletAddressBep20 || "",
      walletAddressErc20: traderData.walletAddressErc20 || "",
      walletQrTrc20: traderData.walletQrTrc20 || "",
      walletQrBep20: traderData.walletQrBep20 || "",
      walletQrErc20: traderData.walletQrErc20 || "",
      status: "Active",
      createdAt: new Date().toISOString()
    };

    addDocumentNonBlocking(collection(db, "trader_buy_offers"), offerData);
    toast({ title: "Agent Offer Published", description: "This offer is linked to your node's infrastructure." });
    setIsAddOfferOpen(false);
    resetOfferForm();
  };

  const handleGenerateAiMessage = async () => {
    if (!user || !userData) return;
    setIsAiGenerating(true);
    try {
      const response = await agentAICommunicationAssistant({
        messageType: aiMessageType,
        agentDetails: {
          agentUsername: userData.username,
          referralLink: referralLink,
          traderUsername: traderData?.username,
          commissionRate: traderData?.referralCommission
        },
        clientDetails: aiClientUsername ? { clientUsername: aiClientUsername } : undefined,
        additionalContext: aiAdditionalContext
      });
      setAiGeneratedMessage(response.generatedMessage);
      toast({ title: "AI Message Generated", description: "The message is ready for use." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Generation Failed", description: "Failed to generate AI message." });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const resetOfferForm = () => {
    setOfferPrice("");
    setOfferDisplayName("");
    setOfferDescription("");
    setOfferNetwork(["TRC20"]);
  };

  const toggleNetwork = (net: string) => {
    setOfferNetwork(prev => prev.includes(net) ? prev.filter(n => n !== net) : [...prev, net]);
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
            <LayoutDashboard className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    );
  };

  if (isUserLoading || isUserDataLoading || !user) return <div className="min-h-screen flex items-center justify-center bg-transparent"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;

  const navItems = [
    { id: "referrals", label: "Referrals", icon: Users },
    { id: "marketing", label: "Marketing Hub", icon: Megaphone },
    { id: "trades", label: "Order View", icon: HistoryIcon },
    { id: "ai", label: "AI Assistant", icon: Zap },
    { id: "offers", label: "Positions", icon: LayoutDashboard },
    { id: "support", label: "Support", icon: Headset },
    { id: "settings", label: "Account", icon: Settings }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col font-body selection:bg-primary/30">
      <header className="h-20 border-b border-white/[0.05] bg-black/40 backdrop-blur-2xl px-6 md:px-10 flex items-center justify-between shrink-0 z-[100]">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveTab("marketing")}>
          <div className="transition-transform group-hover:scale-110 duration-500">
            {brandingSettings?.selectedLogo === 'gold' ? (
              <USDTGoldLogo className="w-10 h-10" />
            ) : (
              <USDTOriginalLogo className="w-10 h-10" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-black text-lg md:text-xl uppercase tracking-tighter leading-none">Agent Portal</span>
            <span className="text-[9px] text-primary font-bold uppercase tracking-[0.3em] leading-none mt-1">Hello, @{userData?.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <ISTTimer />
          </div>
          <Button onClick={() => setIsSignOutOpen(true)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5 text-white/40 hover:text-red-500 transition-all">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden md:flex w-72 border-r border-white/[0.05] flex-col p-6 bg-black/20">
          <nav className="space-y-2 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                  activeTab === item.id ? 'bg-primary text-white glow-primary' : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 app-scroll-area">
          <div className="p-6 md:p-10 lg:p-12 space-y-10 pb-40">
          {activeTab === "referrals" ? (
            <div className="space-y-10">
               <Card className="glass-card border-none rounded-[2.5rem] p-10 bg-gradient-to-br from-primary/20 via-transparent to-transparent">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                     <div className="space-y-3">
                        <p className="text-primary text-[10px] uppercase tracking-[0.5em] font-black">Node Promotion Engine</p>
                        <h2 className="text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter leading-tight italic">Refer & Earn Program</h2>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-widest leading-relaxed max-w-lg">
                           Share your unique protocol link. New users signing up will be assigned to your node. You earn {traderData?.referralCommission || 0}% commission on their trade volume.
                        </p>
                     </div>
                     <div className="w-full lg:w-auto space-y-4">
                        <div className="bg-black/40 border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                           <Input readOnly value={referralLink} className="bg-transparent border-none text-[10px] font-mono text-primary w-full lg:w-64 focus-visible:ring-0" />
                           <Button onClick={() => { navigator.clipboard.writeText(referralLink); toast({title: "Link Copied"}); }} size="icon" variant="ghost" className="shrink-0 text-white/40 hover:text-white"><Copy className="w-4 h-4" /></Button>
                        </div>
                        <Button className="w-full h-14 bg-primary glow-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">
                           <Share2 className="w-4 h-4 mr-2" /> Share Link
                        </Button>
                     </div>
                  </div>
               </Card>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="glass-card border-none rounded-[2.5rem] p-8 flex flex-col justify-between">
                     <div className="space-y-2">
                        <p className="text-hierarchy-label">Network Participants</p>
                        <h3 className="text-4xl font-headline font-black text-white italic">{referredUsers?.length || 0}</h3>
                     </div>
                     <div className="flex items-center gap-2 mt-6">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Referred Users</span>
                     </div>
                  </Card>
                  <Card className="glass-card border-none rounded-[2.5rem] p-8 flex flex-col justify-between">
                     <div className="space-y-2">
                        <p className="text-hierarchy-label">Referral Volume</p>
                        <h3 className="text-4xl font-headline font-black text-green-500 italic">₹{referredTrades?.reduce((acc, t) => acc + (t.fiatAmount || 0), 0).toLocaleString()}</h3>
                     </div>
                     <div className="flex items-center gap-2 mt-6">
                        <Percent className="w-4 h-4 text-green-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Total Settled</span>
                     </div>
                  </Card>
               </div>

               <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
                  <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                     <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                        <Users className="w-4 h-4 text-primary" /> My Participants
                     </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                     <Table>
                        <TableHeader className="bg-white/[0.02]">
                           <TableRow className="border-white/5 hover:bg-transparent">
                              <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40">Identity</TableHead>
                              <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Protocol Role</TableHead>
                              <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-center">Status</TableHead>
                              <TableHead className="px-8 h-16 text-[9px] font-black uppercase tracking-widest text-white/40 text-right">Volume Contributed</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {referredUsers?.length === 0 ? (
                              <TableRow>
                                 <TableCell colSpan={4} className="h-40 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-white/10">No Participants Recruited Yet</TableCell>
                              </TableRow>
                           ) : referredUsers?.map((u) => (
                              <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                                 <TableCell className="px-8 py-4">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-primary/40 transition-colors">
                                          <UserCircle className="w-5 h-5 text-white/40 group-hover:text-primary transition-colors" />
                                       </div>
                                       <div className="flex flex-col">
                                          <span className="text-[11px] font-black uppercase tracking-widest text-white">{u.username}</span>
                                          <span className="text-[9px] font-bold uppercase tracking-widest text-white/20">{u.email}</span>
                                       </div>
                                    </div>
                                 </TableCell>
                                 <TableCell className="px-8 py-4 text-center">
                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/10 text-white/40">{u.role}</Badge>
                                 </TableCell>
                                 <TableCell className="px-8 py-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                       <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-red-500'}`} />
                                       <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{u.isActive ? 'Active' : 'Locked'}</span>
                                    </div>
                                 </TableCell>
                                 <TableCell className="px-8 py-4 text-right">
                                    <span className="text-[11px] font-black text-primary">₹{(referredTrades?.filter(t => t.clientId === u.id).reduce((acc, t) => acc + (t.fiatAmount || 0), 0) || 0).toLocaleString()}</span>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </CardContent>
               </Card>
            </div>
          ) : activeTab === "marketing" ? (
            <div className="space-y-12 animate-in-scale">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <Card className="glass-card border-none rounded-[2.5rem] p-10 bg-gradient-to-br from-primary/20 via-transparent to-transparent">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <Rocket className="w-6 h-6 text-primary" />
                              <p className="text-primary text-[10px] uppercase tracking-[0.5em] font-black">Growth Accelerator</p>
                           </div>
                           <h2 className="text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter leading-tight italic">Profit Strategies</h2>
                           <p className="text-white/40 text-xs font-medium uppercase tracking-widest leading-relaxed max-w-lg">
                              Empower your referrals with these proven methods to maximize their earnings on ConnectCrypto.
                           </p>
                        </div>
                     </Card>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {PROFIT_STRATEGIES.map((strategy, idx) => (
                           <Card key={idx} className="glass-card border-none rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all group">
                              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                                 <strategy.icon className="w-6 h-6 text-primary" />
                              </div>
                              <h3 className="text-sm font-black uppercase tracking-widest text-white">{strategy.title}</h3>
                              <p className="text-[11px] text-white/40 leading-relaxed font-medium uppercase tracking-wider">{strategy.description}</p>
                           </Card>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="flex items-center justify-between px-4">
                        <div className="space-y-1">
                           <h3 className="text-xl font-headline font-black uppercase tracking-tighter italic flex items-center gap-3">
                              <Megaphone className="w-5 h-5 text-primary" /> Share Templates
                           </h3>
                           <p className="text-[9px] font-black uppercase tracking-widest text-white/20">10+ Verified Marketing Templates</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary text-[8px] font-black uppercase tracking-widest px-3 py-1">Ready to Use</Badge>
                     </div>

                     <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[800px] pr-4 no-scrollbar">
                        {MARKETING_TEMPLATES.map((template, idx) => (
                           <Card key={idx} className="glass-card border-none rounded-[2rem] p-8 space-y-6 hover:bg-white/[0.02] transition-all group">
                              <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-primary">{template.type}</p>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white/80">{template.title}</h4>
                                 </div>
                                 <Button 
                                    onClick={() => { 
                                       const text = template.content.replace("{link}", referralLink);
                                       navigator.clipboard.writeText(text); 
                                       toast({title: "Template Copied", description: "Ready to share with link."}); 
                                    }}
                                    size="sm" 
                                    className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl px-4 text-[9px] font-black uppercase tracking-widest transition-all"
                                 >
                                    <Copy className="w-3.5 h-3.5 mr-2" /> Copy Message
                                 </Button>
                              </div>
                              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 relative">
                                 <p className="text-[11px] text-white/60 leading-relaxed font-medium">
                                    {template.content.replace("{link}", referralLink)}
                                 </p>
                                 <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                 </div>
                              </div>
                           </Card>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === "ai" ? (
            <div className="space-y-10 animate-in-scale">
               <Card className="glass-card border-none rounded-[2.5rem] p-10 bg-gradient-to-br from-primary/20 via-transparent to-transparent">
                  <div className="space-y-3">
                     <p className="text-primary text-[10px] uppercase tracking-[0.5em] font-black">Agent Growth Suite</p>
                     <h2 className="text-3xl md:text-5xl font-headline font-black uppercase tracking-tighter leading-tight italic">AI Communication Assistant</h2>
                     <p className="text-white/40 text-xs font-medium uppercase tracking-widest leading-relaxed max-w-lg">
                        Generate professional recruitment, onboarding, and support messages tailored to your referral network.
                     </p>
                  </div>
               </Card>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <Card className="glass-card border-none rounded-[2.5rem] p-8 space-y-8">
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <Label className="text-hierarchy-label ml-2">Message Purpose</Label>
                           <div className="grid grid-cols-3 gap-3">
                              {(["recruitment", "onboarding", "support"] as const).map((type) => (
                                 <Button
                                    key={type}
                                    onClick={() => setAiMessageType(type)}
                                    variant={aiMessageType === type ? "default" : "outline"}
                                    className={`h-12 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                       aiMessageType === type ? 'bg-primary glow-primary' : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                 >
                                    {type}
                                 </Button>
                              ))}
                           </div>
                        </div>

                        {aiMessageType !== "recruitment" && (
                           <div className="space-y-3 animate-in-slide-up">
                              <Label className="text-hierarchy-label ml-2">Referral Username (Optional)</Label>
                              <Input 
                                 value={aiClientUsername}
                                 onChange={(e) => setAiClientUsername(e.target.value)}
                                 placeholder="e.g. cryptoking" 
                                 className="bg-white/5 border-white/10 h-14 rounded-xl text-white px-6 focus:ring-primary/50 font-bold"
                              />
                           </div>
                        )}

                        <div className="space-y-3">
                           <Label className="text-hierarchy-label ml-2">Additional Context / Instructions</Label>
                           <textarea 
                              value={aiAdditionalContext}
                              onChange={(e) => setAiAdditionalContext(e.target.value)}
                              placeholder="e.g. Focus on the 0.5% commission rate or the high security of the node."
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white min-h-[120px] focus:ring-1 focus:ring-primary/50 outline-none transition-all font-medium text-sm placeholder:opacity-20"
                           />
                        </div>

                        <Button 
                           onClick={handleGenerateAiMessage}
                           disabled={isAiGenerating}
                           className="w-full h-16 bg-primary glow-primary text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] hover:scale-[1.02] transition-all"
                        >
                           {isAiGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                              <>
                                 <Zap className="w-4 h-4 mr-2" /> Generate Message
                              </>
                           )}
                        </Button>
                     </div>
                  </Card>

                  <Card className="glass-card border-none rounded-[2.5rem] p-8 flex flex-col min-h-[400px]">
                     <div className="flex justify-between items-center mb-6">
                        <Label className="text-hierarchy-label ml-2">Generated Message Output</Label>
                        {aiGeneratedMessage && (
                           <Button 
                              onClick={() => { navigator.clipboard.writeText(aiGeneratedMessage); toast({title: "Message Copied"}); }}
                              variant="ghost" 
                              size="sm"
                              className="text-primary hover:text-primary/80 font-black uppercase tracking-widest text-[9px]"
                           >
                              <Copy className="w-3.5 h-3.5 mr-2" /> Copy
                           </Button>
                        )}
                     </div>
                     <div className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-8 relative group overflow-hidden">
                        {aiGeneratedMessage ? (
                           <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                              {aiGeneratedMessage}
                           </p>
                        ) : (
                           <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-10 opacity-20 group-hover:opacity-40 transition-opacity">
                              <Zap className="w-12 h-12 mb-4 text-primary" />
                              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Awaiting Generation</p>
                           </div>
                        )}
                     </div>
                  </Card>
               </div>
            </div>
          ) : activeTab === "trades" ? (
            <Card className="glass-card border-none rounded-[2.5rem] overflow-hidden">
               <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3">
                     <History className="w-4 h-4 text-primary" /> Referral Order Feed
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                  <Table>
                     <TableHeader>
                        <TableRow className="border-white/[0.05]">
                           <TableHead className="px-8 text-hierarchy-label">Ref ID</TableHead>
                           <TableHead className="text-hierarchy-label">User</TableHead>
                           <TableHead className="text-hierarchy-label">Value</TableHead>
                           <TableHead className="text-hierarchy-label">Status</TableHead>
                           <TableHead className="text-right px-8 text-hierarchy-label">Time</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {referredTrades?.map(t => (
                          <TableRow key={t.id} className="border-white/[0.05] hover:bg-white/[0.02]">
                             <TableCell className="px-8 py-4 font-mono text-[9px] text-white/40">#{t.id.slice(-6).toUpperCase()}</TableCell>
                             <TableCell className="text-xs font-black text-white uppercase italic">{t.clientUsername}</TableCell>
                             <TableCell className="text-xs font-black text-white italic">₹{t.fiatAmount.toLocaleString()}</TableCell>
                             <TableCell>
                                <Badge className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border-none ${
                                  t.status === "Success" ? "bg-green-500/10 text-green-500" : 
                                  t.status === "Pending" || t.status === "Paid" ? "bg-amber-500/10 text-amber-500" : 
                                  "bg-primary/10 text-primary"
                                }`}>{t.status}</Badge>
                             </TableCell>
                             <TableCell className="text-right px-8 text-[9px] text-white/40 uppercase font-bold">{new Date(t.initiationTime).toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                        {!referredTrades?.length && (
                          <TableRow><TableCell colSpan={5} className="h-40 text-center opacity-20 uppercase font-black tracking-widest text-[10px]">No orders from your network</TableCell></TableRow>
                        )}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
          ) : activeTab === "offers" ? (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-headline font-black uppercase tracking-tight">Promotional Positions</h2>
                  <Button onClick={() => setIsAddOfferOpen(true)} className="bg-primary glow-primary h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white"><Plus className="w-5 h-5 mr-2" /> Create Position</Button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in-scale">
                  {myOffers?.map(off => (
                    <Card key={off.id} className="glass-card border-none rounded-[2.5rem] p-6 flex flex-col min-h-[220px] justify-between space-y-6 hover:border-primary/40 transition-all duration-500 group/card relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                      <div className="space-y-6 relative z-10">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {off.iconCid || off.cryptoAssetId?.toUpperCase().includes("USDT") ? (
                              <div className={`relative w-12 h-12 rounded-full overflow-hidden shrink-0 group-hover/card:scale-110 transition-transform duration-500 ${off.cryptoAssetId?.toUpperCase().includes("USDT") ? '' : 'border border-white/10 bg-white/5 shadow-inner'}`}>
                                <Image 
                                  src={`https://ipfs.io/ipfs/${off.cryptoAssetId?.toUpperCase().includes("USDT") ? "bafybeicygbg5kw4b5wyzx7rsv7zen5qmgda6jkn57phoqhp67jji7fpefa" : off.iconCid}`} 
                                  alt={off.cryptoAssetId} 
                                  fill 
                                  className="object-cover scale-[0.8]" 
                                  unoptimized 
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                                <LayoutDashboard className="w-6 h-6 text-muted-foreground opacity-20" />
                              </div>
                            )}
                            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                              <p className="text-[10px] text-primary font-black uppercase tracking-[0.2em] truncate opacity-80 mb-0.5">
                                {off.displayName}
                              </p>
                              <p className="font-headline font-black text-xl uppercase tracking-tighter text-white group-hover/card:text-primary transition-colors truncate">
                                {off.cryptoAssetId}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-white/5 flex justify-between items-end relative z-10">
                        <div className="flex flex-col gap-1">
                          <span className="text-hierarchy-label tracking-widest">Market Rate</span>
                          <p className="text-2xl font-headline font-black text-white leading-none italic group-hover/card:text-primary transition-colors tracking-tighter">{off.fixedPricePerCrypto} <span className="text-[10px] opacity-40 not-italic font-bold ml-1">{off.fiatCurrency}</span></p>
                        </div>
                        <Badge variant="outline" className="text-[9px] py-1 px-3 border-green-500/20 text-green-500 uppercase font-black tracking-widest bg-green-500/5 rounded-full">
                          Live
                        </Badge>
                      </div>
                    </Card>
                  ))}
                  <button onClick={() => setIsAddOfferOpen(true)} className="border-2 border-dashed border-white/10 rounded-[2.5rem] h-[220px] flex flex-col items-center justify-center gap-4 hover:border-primary/40 hover:bg-white/[0.02] transition-all group duration-500 animate-in-scale">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                       <Plus className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground group-hover:text-white transition-colors">Create Position</span>
                  </button>
               </div>
            </div>
          ) : null}
          </div>
        </main>
      </div>

      {/* Sign Out Dialog */}
      <AlertDialog open={isSignOutOpen} onOpenChange={setIsSignOutOpen}>
        <AlertDialogContent className="glass-card border-white/10 rounded-[2.5rem] p-10 max-w-md">
          <AlertDialogHeader><AlertDialogTitle className="text-2xl font-headline font-black uppercase tracking-tight text-white">Authorize Sign Out?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogDescription className="text-white/40 uppercase text-[10px] tracking-widest font-bold leading-relaxed">Closing your agent session will disable your real-time network tracking until your next secure authorization.</AlertDialogDescription>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => signOut(auth)} className="bg-red-500 hover:bg-red-600 rounded-2xl h-14 text-[10px] font-bold uppercase tracking-widest text-white glow-primary transition-all">Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Offer Dialog */}
      <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
        <DialogContent className="glass-card border-white/10 rounded-[2.5rem] p-8 max-w-lg">
          <DialogHeader><DialogTitle className="text-xl font-bold uppercase text-white">Open Promotional Position</DialogTitle></DialogHeader>
          <div className="space-y-6 py-4">
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Asset</Label>
                  <Input value={offerCrypto} onChange={e => setOfferCrypto(e.target.value.toUpperCase())} placeholder="USDT" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Price Rate</Label>
                  <Input type="number" step="0.01" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-[9px] uppercase font-bold opacity-50 ml-1">Display Name</Label>
                <Input value={offerDisplayName} onChange={e => setOfferDisplayName(e.target.value)} placeholder="e.g. Premium Node Access" className="bg-white/5 border-white/10 h-12 rounded-xl focus:ring-primary/50" />
             </div>
             <div className="pt-4 border-t border-white/5 space-y-2">
                <p className="text-[8px] text-primary/60 uppercase font-black tracking-widest text-center leading-relaxed bg-primary/5 p-4 rounded-2xl border border-primary/10">
                   Notice: This position will use the infrastructure wallets of your assigned Trader Node: {traderData?.username}.
                </p>
             </div>
          </div>
          <DialogFooter><Button onClick={handleOpenPosition} className="w-full h-14 bg-primary rounded-xl font-bold uppercase tracking-widest text-[10px] text-white glow-primary">Confirm & Publish</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
