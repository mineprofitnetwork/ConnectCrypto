
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  DialogDescription
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
  Trash2, 
  Landmark, 
  Settings, 
  UserCircle, 
  Image as ImageIcon,
  Check,
  ChevronRight,
  ShieldCheck,
  Zap,
  ExternalLink,
  Copy,
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
  Link2,
  Wallet,
  Wand2
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, where, doc, setDoc, getDoc, updateDoc, increment, orderBy, onSnapshot, limit, runTransaction } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { signOut, createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { firebaseConfig } from "@/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { ISTTimer } from "@/components/ui/ist-timer";
import { USDTGoldLogo } from "@/components/logos/USDTGoldLogo";
import { USDTOriginalLogo } from "@/components/logos/USDTOriginalLogo";
import Image from "next/image";

export default function TraderDashboard() {
  const [activeTab, setActiveTab] = useState("offers");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAddGatewayOpen, setIsAddGatewayOpen] = useState(false);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  
  const [gatewayType, setGatewayType] = useState("UPI");
  const [accountName, setAccountName] = useState("");
  const [accountDetail, setAccountDetail] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

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

  // Agent Management States
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentUsername, setNewAgentUsername] = useState("");
  const [newAgentPass, setNewAgentPass] = useState("agent123");
  const [isProvisioningAgent, setIsProvisioningAgent] = useState(false);
  const [isAgentProvisionOpen, setIsAgentProvisionOpen] = useState(false);

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

  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // FORCED RE-FETCH: bypass memoization for user doc
  const [userData, setUserData] = useState<any>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsUserDataLoading(true);
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        setUserData(doc.data());
        setIsUserDataLoading(false);
      });
      return () => unsub();
    } else if (!isUserLoading) {
      setIsUserDataLoading(false);
    }
  }, [user, isUserLoading, db]);

  const pendingTradesQuery = useMemoFirebase(() => user ? query(collection(db, "trade_transactions"), where("traderId", "==", user.uid), where("status", "in", ["Paid", "Hold", "KYC Required"]), orderBy("initiationTime", "desc"), limit(100)) : null, [db, user?.uid]);
  const { data: pendingTrades } = useCollection(pendingTradesQuery);

  const myOffersQuery = useMemoFirebase(() => user ? query(collection(db, "trader_buy_offers"), where("traderId", "==", user.uid), orderBy("createdAt", "desc"), limit(50)) : null, [db, user?.uid]);
  const { data: myOffers } = useCollection(myOffersQuery);

  const successTradesQuery = useMemoFirebase(() => user ? query(collection(db, "trade_transactions"), where("traderId", "==", user.uid), where("status", "==", "Success"), orderBy("initiationTime", "desc"), limit(200)) : null, [db, user?.uid]);
  const { data: successTrades } = useCollection(successTradesQuery);

  const gatewaysQuery = useMemoFirebase(() => user ? query(collection(db, "users", user.uid, "fiat_payment_methods"), orderBy("createdAt", "desc"), limit(20)) : null, [db, user?.uid]);
  const { data: gateways } = useCollection(gatewaysQuery);

  const myWithdrawalsQuery = useMemoFirebase(() => user ? query(collection(db, "withdrawals"), where("traderId", "==", user.uid), orderBy("createdAt", "desc"), limit(100)) : null, [db, user?.uid]);
  const { data: allWithdrawals } = useCollection(myWithdrawalsQuery);

  const myAgentsQuery = useMemoFirebase(() => user ? query(collection(db, "users"), where("traderId", "==", user.uid), where("role", "==", "agent"), limit(50)) : null, [db, user?.uid]);
  const { data: myAgents } = useCollection(myAgentsQuery);

  const brandingDocRef = useMemoFirebase(() => doc(db, "settings", "branding"), [db]);
  const { data: brandingSettings } = useDoc(brandingDocRef);

  const totalCryptoReceived = useMemo(() => {
    if (!successTrades) return 0;
    return successTrades.reduce((acc, trade) => acc + (trade.cryptoAmount || 0), 0);
  }, [successTrades]);

  const totalMoneyPaid = useMemo(() => {
    if (!allWithdrawals) return 0;
    return allWithdrawals
      .filter(w => w.status === "Success")
      .reduce((acc, w) => acc + (w.amount || 0), 0);
  }, [allWithdrawals]);

  const totalMoneyToPay = useMemo(() => {
    const totalFiatReceived = successTrades?.reduce((acc, trade) => acc + (trade.fiatAmount || 0), 0) || 0;
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
      fullName: formData.get("fullName"),
      username: formData.get("username")
    };
    updateDocumentNonBlocking(doc(db, "users", user.uid), updates);
    toast({ title: "Profile Updated" });
  };

  const handleUpdateWallets = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const updates = {
      walletAddressTrc20: formData.get("trc20")?.toString().trim() || "",
      walletQrTrc20: formData.get("trc20Qr")?.toString().trim() || "",
      walletAddressBep20: formData.get("bep20")?.toString().trim() || "",
      walletQrBep20: formData.get("bep20Qr")?.toString().trim() || "",
      walletAddressErc20: formData.get("erc20")?.toString().trim() || "",
      walletQrErc20: formData.get("erc20Qr")?.toString().trim() || "",
      referralCommission: parseFloat(formData.get("commission")?.toString() || "0")
    };
    updateDocumentNonBlocking(doc(db, "users", user.uid), updates);
    toast({ title: "Institutional Wallets Updated", description: "All new offers will use these endpoints." });
  };

  const handleProvisionAgent = async () => {
    if (!user || !newAgentEmail || !newAgentUsername || !newAgentPass) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsProvisioningAgent(true);
    try {
      // 1. Create temporary Firebase app to create Auth account
      const tempAppId = `temp-agent-app-${Date.now()}`;
      const tempApp = initializeApp(firebaseConfig, tempAppId);
      const tempAuth = getAuth(tempApp);
      
      const userCredential = await createUserWithEmailAndPassword(tempAuth, newAgentEmail.trim().toLowerCase(), newAgentPass);
      const uid = userCredential.user.uid;

      // 2. Create Firestore profile
      const agentData = {
        id: uid,
        email: newAgentEmail.trim().toLowerCase(),
        username: newAgentUsername.trim().toLowerCase().replace(/\s+/g, '_'),
        password: newAgentPass,
        role: "agent",
        traderId: user.uid,
        traderUsername: userData?.username || "Verified Node",
        isActive: true,
        status: "active",
        createdAt: new Date().toISOString(),
        referralCode: generateReferralCode()
      };

      await setDoc(doc(db, "users", uid), agentData);
      
      // Also update trader's document to ensure we have a link (though query handles it)
      await updateDoc(doc(db, "users", user.uid), {
        hasAgents: true
      });
      
      // Cleanup temp app
      await deleteApp(tempApp);

      toast({ title: "Agent Provisioned", description: `${newAgentUsername} is now authorized for your node.` });
      setNewAgentEmail("");
      setNewAgentUsername("");
      setNewAgentPass("agent123");
      setIsAgentProvisionOpen(false);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/email-already-in-use') {
        toast({ variant: "destructive", title: "Identity Conflict", description: "This email is already registered on the protocol." });
      } else {
        toast({ variant: "destructive", title: "Provisioning Failed", description: e.message });
      }
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

  const handleAddGateway = async () => {
    if (!user || !accountName || !accountDetail) return;
    const gatewayId = `gateway_${Math.random().toString(36).slice(2, 9)}`;
    const gatewayRef = doc(db, "users", user.uid, "fiat_payment_methods", gatewayId);
    
    const gatewayData: any = {
      id: gatewayId,
      userId: user.uid,
      methodType: gatewayType,
      accountHolderName: accountName,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (gatewayType === "UPI") {
      gatewayData.upiId = accountDetail;
    } else {
      gatewayData.bankName = bankName;
      gatewayData.accountNumber = accountDetail;
      gatewayData.ifscSwiftCode = ifscCode;
    }

    setDoc(gatewayRef, gatewayData);
    toast({ title: "Gateway Linked", description: "Node endpoint established." });
    setIsAddGatewayOpen(false);
    resetGatewayForm();
  };

  const resetGatewayForm = () => {
    setAccountName("");
    setAccountDetail("");
    setIfscCode("");
    setBankName("");
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
    if (!user || !offerPrice) return;
    
    const offerData: any = {
      traderId: user.uid,
      traderUsername: userData?.username || "Verified Node",
      displayName: offerDisplayName.trim() || userData?.username || "Verified Node",
      cryptoAssetId: offerCrypto.toUpperCase(),
      network: offerNetwork.toUpperCase(),
      fiatCurrency: offerFiat.toUpperCase(),
      fixedPricePerCrypto: parseFloat(offerPrice),
      description: offerDescription,
      iconCid: offerIconCid.trim(),
      // Use institutional wallets from settings
      walletAddressTrc20: userData?.walletAddressTrc20 || "",
      walletAddressBep20: userData?.walletAddressBep20 || "",
      walletAddressErc20: userData?.walletAddressErc20 || "",
      walletQrTrc20: userData?.walletQrTrc20 || "",
      walletQrBep20: userData?.walletQrBep20 || "",
      walletQrErc20: userData?.walletQrErc20 || "",
      status: "Active",
      createdAt: new Date().toISOString()
    };

    if (editingOfferId) {
      updateDocumentNonBlocking(doc(db, "trader_buy_offers", editingOfferId), offerData);
      toast({ title: "Position Updated" });
    } else {
      addDocumentNonBlocking(collection(db, "trader_buy_offers"), offerData);
      toast({ title: "Position Opened" });
    }

    setIsAddOfferOpen(false);
    setEditingOfferId(null);
    // Clear states
    resetOfferForm();
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
  };

  const handleEditOffer = (off: any) => {
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
    setIsAddOfferOpen(true);
  };

  const handleDuplicateOffer = (off: any) => {
    setEditingOfferId(null); // Ensure it's a new document
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
    setIsAddOfferOpen(true);
    toast({ title: "Draft Created", description: "Offer details duplicated. Review and publish." });
  };

  const handleApproveTrade = async (trade: any) => {
    try {
      await runTransaction(db, async (transaction) => {
        const tradeDocRef = doc(db, "trade_transactions", trade.id);
        const tradeDoc = await transaction.get(tradeDocRef);
        
        if (!tradeDoc.exists()) {
          throw "Trade document does not exist!";
        }
        
        const currentData = tradeDoc.data();
        if (currentData.status === "Success") {
          throw "Trade already approved!";
        }

        transaction.update(tradeDocRef, { status: "Success" });
        
        // Update Client Balance (Receive Fiat)
        const clientRef = doc(db, "users", trade.clientId);
        transaction.update(clientRef, {
          balance: increment(trade.fiatAmount)
        });

        // Update Trader Balance (Track Earnings/Assets Received Volume)
        if (user) {
          const traderRef = doc(db, "users", user.uid);
          transaction.update(traderRef, {
            balance: increment(trade.fiatAmount)
          });
        }
      });

      toast({ title: "Trade Approved", description: "Funds released to client wallet." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Protocol Error", description: typeof e === 'string' ? e : "Failed to release funds." });
    }
  };

  const handleTradeStatusUpdate = async (trade: any, newStatus: string) => {
    try {
      await updateDoc(doc(db, "trade_transactions", trade.id), { status: newStatus });
      toast({ title: "Status Updated", description: `Trade status changed to ${newStatus}.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Update Failed", description: "Failed to update trade status." });
    }
  };

  const handleWithdrawalAction = async (withdrawal: any, newStatus: string) => {
    try {
      if (newStatus === "Success") {
        await runTransaction(db, async (transaction) => {
          const withdrawalRef = doc(db, "withdrawals", withdrawal.id);
          const withdrawalDoc = await transaction.get(withdrawalRef);
          
          if (!withdrawalDoc.exists()) throw "Withdrawal not found";
          if (withdrawalDoc.data().status === "Success") throw "Already processed";

          const userRef = doc(db, "users", withdrawal.userId);
          const userSnap = await transaction.get(userRef);
          
          if (!userSnap.exists()) throw "User not found";
          
          const currentBalance = userSnap.data().balance || 0;
          if (currentBalance < withdrawal.amount) {
             throw "Insufficient Balance";
          }

          // Deduct balance and update status
          transaction.update(userRef, { balance: increment(-withdrawal.amount) });
          transaction.update(withdrawalRef, { status: "Success", processedAt: new Date().toISOString() });
        });
        
        toast({ title: "Withdrawal Marked as Paid", description: "Balance deducted and status updated." });
      } else {
        // Just update status (Hold, Verification Required)
        await updateDoc(doc(db, "withdrawals", withdrawal.id), { status: newStatus });
        toast({ title: "Status Updated", description: `Withdrawal status changed to ${newStatus}.` });
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


        {activeTab === "queue" ? (
          <div>Queue Content</div>
        ) : activeTab === "settlements" ? (
          <div>Settlements Content</div>
        ) : activeTab === "offers" ? (
          <div>Offers Content</div>
        ) : activeTab === "agents" ? (
          <div>Agents Content</div>
        ) : activeTab === "history" ? (
          <div>History Content</div>
        ) : activeTab === "support" ? (
          <div>Support Content</div>
        ) : activeTab === "settings" ? (
          <div>Settings Content</div>
        ) : null}

      </div>
    </main>
  </div>
  );
}
