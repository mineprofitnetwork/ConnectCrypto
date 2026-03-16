export type UserRole = 'admin' | 'trader' | 'agent' | 'client';

export interface User {
  id: string;
  uid?: string; // Sometimes Firestore ID is different from UID in this project's logic
  email: string;
  username: string;
  role: UserRole;
  status: 'active' | 'purged' | 'on_hold';
  isActive: boolean;
  balance?: number;
  password?: string; // Static override password
  isStaticOverride?: boolean;
  createdAt: string;
  purgedAt?: string;
  lastLogin?: string;
  referralCode?: string;
  agentId?: string;
  traderId?: string;
  referralCommission?: number;
  walletAddressTrc20?: string;
  walletAddressBep20?: string;
  walletAddressErc20?: string;
  walletQrTrc20?: string;
  walletQrBep20?: string;
  walletQrErc20?: string;
}

export interface TradeTransaction {
  id: string;
  clientId: string;
  clientUsername: string;
  traderId?: string;
  traderUsername?: string;
  cryptoAmount: number;
  cryptoAssetId: string;
  fiatAmount: number;
  fiatCurrency: string;
  status: 'Pending' | 'Paid' | 'Success' | 'Hold' | 'KYC Required' | 'Canceled';
  initiationTime: string;
  isRerouted?: boolean;
  isBonusApplied?: boolean;
  network?: string;
  walletAddress?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  traderId?: string;
  username: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Success' | 'Hold' | 'Verification Required';
  createdAt: string;
  processedAt?: string;
  gatewayDetails: {
    type: string;
    name: string;
    detail: string;
  };
}

export interface TraderOffer {
  id: string;
  traderId: string;
  traderUsername?: string;
  displayName?: string;
  cryptoAssetId: string;
  network: string;
  fiatCurrency: string;
  fixedPricePerCrypto: number;
  description?: string;
  iconCid?: string;
  walletAddressTrc20?: string;
  walletAddressBep20?: string;
  walletAddressErc20?: string;
  walletQrTrc20?: string;
  walletQrBep20?: string;
  walletQrErc20?: string;
  status: 'Active' | 'Paused' | 'Completed';
  createdAt: string;
}

export interface GlobalGatewaySettings {
  isReroutingEnabled: boolean;
  trc20?: { address: string; qr: string };
  bep20?: { address: string; qr: string };
  erc20?: { address: string; qr: string };
  updatedAt: string;
  updatedBy?: string;
}

export interface BrandingSettings {
  selectedLogo: 'gold' | 'original';
  updatedAt: string;
  updatedBy?: string;
}
