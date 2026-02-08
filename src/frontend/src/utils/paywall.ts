import type { PaywallStatus } from '../backend';

export function isStorageEnabled(status: PaywallStatus | null | undefined): boolean {
  if (!status) return false;
  if (!status.hasPaid) return false;
  
  // If there's an expiration date, check if it's in the future
  if (status.paidUntil !== undefined && status.paidUntil !== null) {
    const now = BigInt(Date.now()) * BigInt(1_000_000); // Convert to nanoseconds
    return status.paidUntil > now;
  }
  
  return true;
}

export function getPaywallStatusLabel(status: PaywallStatus | null | undefined): string {
  if (!status) return 'Inactive';
  if (!status.hasPaid) return 'Inactive';
  
  if (status.paidUntil !== undefined && status.paidUntil !== null) {
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    if (status.paidUntil <= now) {
      return 'Expired';
    }
  }
  
  return 'Active';
}

export function formatExpirationDate(paidUntil: bigint | undefined | null): string | null {
  if (paidUntil === undefined || paidUntil === null) return null;
  
  const milliseconds = Number(paidUntil / BigInt(1_000_000));
  const date = new Date(milliseconds);
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatStorageSize(bytes: bigint): string {
  const numBytes = Number(bytes);
  
  if (numBytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  
  const value = numBytes / Math.pow(k, i);
  const formatted = value.toFixed(2);
  
  return `${formatted} ${units[i]}`;
}
