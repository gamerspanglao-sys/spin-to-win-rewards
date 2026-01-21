// Voucher system for prize management

const VOUCHERS_STORAGE_KEY = 'gamers_vouchers';
const VOUCHER_VALIDITY_DAYS = 7;

// Characters that are easy to read (no 0/O, 1/I/L confusion)
const VOUCHER_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export interface Voucher {
  id: string;
  code: string;
  playerName: string;
  prize: {
    label: string;
    color: string;
  };
  createdAt: number;
  expiresAt: number;
  redeemed: boolean;
  redeemedAt?: number;
}

// Generate a unique 6-character code
export const generateVoucherCode = (): string => {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += VOUCHER_CHARS.charAt(Math.floor(Math.random() * VOUCHER_CHARS.length));
  }
  return code;
};

// Create a new voucher
export const createVoucher = (
  playerName: string,
  prizeLabel: string,
  prizeColor: string
): Voucher => {
  const now = Date.now();
  const expiresAt = now + (VOUCHER_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  
  // Generate unique code, checking for duplicates
  let code = generateVoucherCode();
  const existingVouchers = getVouchers();
  while (existingVouchers.some(v => v.code === code)) {
    code = generateVoucherCode();
  }
  
  return {
    id: `voucher_${now}_${Math.random().toString(36).substring(2, 9)}`,
    code,
    playerName,
    prize: {
      label: prizeLabel,
      color: prizeColor,
    },
    createdAt: now,
    expiresAt,
    redeemed: false,
  };
};

// Get all vouchers from localStorage
export const getVouchers = (): Voucher[] => {
  try {
    const saved = localStorage.getItem(VOUCHERS_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load vouchers', e);
  }
  return [];
};

// Save voucher to localStorage
export const saveVoucher = (voucher: Voucher): void => {
  const vouchers = getVouchers();
  vouchers.push(voucher);
  localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
};

// Find voucher by code
export const findVoucherByCode = (code: string): Voucher | undefined => {
  const vouchers = getVouchers();
  return vouchers.find(v => v.code.toUpperCase() === code.toUpperCase());
};

// Check if voucher is valid (not expired and not redeemed)
export const isVoucherValid = (voucher: Voucher): boolean => {
  const now = Date.now();
  return !voucher.redeemed && voucher.expiresAt > now;
};

// Mark voucher as redeemed
export const redeemVoucher = (code: string): { success: boolean; voucher?: Voucher; error?: string } => {
  const vouchers = getVouchers();
  const index = vouchers.findIndex(v => v.code.toUpperCase() === code.toUpperCase());
  
  if (index === -1) {
    return { success: false, error: 'Voucher not found' };
  }
  
  const voucher = vouchers[index];
  
  if (voucher.redeemed) {
    return { success: false, error: 'Voucher already redeemed', voucher };
  }
  
  if (voucher.expiresAt < Date.now()) {
    return { success: false, error: 'Voucher expired', voucher };
  }
  
  // Mark as redeemed
  vouchers[index] = {
    ...voucher,
    redeemed: true,
    redeemedAt: Date.now(),
  };
  
  localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(vouchers));
  
  return { success: true, voucher: vouchers[index] };
};

// Clean up expired vouchers (call on app load)
export const cleanExpiredVouchers = (): void => {
  const vouchers = getVouchers();
  const now = Date.now();
  
  // Keep vouchers that are either valid or redeemed within last 30 days
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const filtered = vouchers.filter(v => {
    if (v.expiresAt > now) return true; // Still valid
    if (v.redeemed && v.redeemedAt && v.redeemedAt > thirtyDaysAgo) return true; // Recently redeemed
    return false;
  });
  
  if (filtered.length !== vouchers.length) {
    localStorage.setItem(VOUCHERS_STORAGE_KEY, JSON.stringify(filtered));
  }
};

// Format expiry date for display
export const formatExpiryDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Check if prize should generate a voucher (exclude "See you tomorrow")
export const shouldGenerateVoucher = (prizeLabel: string): boolean => {
  const excludedPrizes = ['see you tomorrow'];
  return !excludedPrizes.some(excluded => 
    prizeLabel.toLowerCase().includes(excluded)
  );
};
