export interface Profile extends User {
  password_hash?: string;
  aadhar_number?: string;
  pan_number?: string;
  kyc_status: 'None' | 'Pending' | 'Verified' | 'Rejected';
  kyc_submitted_at?: string;
}

export type UserRole = 'admin' | 'trader' | 'agent' | 'client';

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  balance: number;
  is_active: boolean;
  created_at: string;
  purged_at?: string;
  last_login?: string;
  referral_code?: string;
  agent_id?: string;
  trader_id?: string;
  referral_commission?: number;
  wallet_address_trc20?: string;
  wallet_address_bep20?: string;
  wallet_address_erc20?: string;
  wallet_qr_trc20?: string;
  wallet_qr_bep20?: string;
  wallet_qr_erc20?: string;
}

export interface TradeTransaction {
  id: string;
  client_id: string;
  client_username: string;
  agent_id?: string;
  agent_username?: string;
  trader_id?: string;
  trader_username?: string;
  crypto_amount: number;
  crypto_asset_id: string;
  fiat_amount: number;
  fiat_currency: string;
  status: 'Pending' | 'Paid' | 'Success' | 'Hold' | 'KYC Required' | 'Canceled';
  initiation_time: string;
  is_rerouted?: boolean;
  is_bonus_applied?: boolean;
  network?: string;
  trader_wallet_address?: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  trader_id?: string;
  username: string;
  amount: number;
  currency: string;
  status: 'Pending' | 'Success' | 'Hold' | 'Verification Required';
  created_at: string;
  processed_at?: string;
  gateway_details: {
    type: string;
    name: string;
    detail: string;
  };
}

export interface TraderOffer {
  id: string;
  trader_id: string;
  trader_username?: string;
  display_name?: string;
  crypto_asset_id: string;
  network: string;
  fiat_currency: string;
  fixed_price_per_crypto: number;
  description?: string;
  icon_cid?: string;
  wallet_address_trc20?: string;
  wallet_address_bep20?: string;
  wallet_address_erc20?: string;
  wallet_qr_trc20?: string;
  wallet_qr_bep20?: string;
  wallet_qr_erc20?: string;
  status: 'Active' | 'Paused' | 'Completed';
  created_at: string;
}

export interface FiatPaymentMethod {
  id: string;
  user_id: string;
  method_type: 'UPI' | 'Bank Transfer';
  account_holder_name: string;
  upi_id?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_swift_code?: string;
  is_active: boolean;
  created_at: string;
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
  selectedLogo: 'gold' | 'original' | 'custom';
  customLogoCid?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface GlobalSettings {
  id: string;
  branding: BrandingSettings;
  global_gateway: GlobalGatewaySettings;
  updated_at: string;
}
