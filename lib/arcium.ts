/**
 * Arcium Confidential Compute — Real AES-GCM encryption engine
 *
 * Salaries are encrypted with AES-256-GCM using a key derived from the
 * employer's wallet signature. The ciphertext is stored in the database.
 * Only the key holder (employer who signed) can decrypt.
 */

export async function deriveEncryptionKey(
  walletAddress: string,
  signature: string
): Promise<CryptoKey> {
  const material = `zeropay-confidential:${walletAddress.toLowerCase()}:${signature}`;
  const encoder = new TextEncoder();
  const rawKey = await crypto.subtle.digest('SHA-256', encoder.encode(material));

  return crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSalary(
  amount: number,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify({ amount, ts: Date.now() }));

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data as BufferSource
  );

  return {
    ciphertext: arrayToBase64(new Uint8Array(encrypted)),
    iv: arrayToBase64(iv),
  };
}

export async function decryptSalary(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<number> {
  const ciphertextBytes = base64ToArray(ciphertext);
  const ivBytes = base64ToArray(iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes as BufferSource },
    key,
    ciphertextBytes as BufferSource
  );

  const decoder = new TextDecoder();
  const json = JSON.parse(decoder.decode(decrypted));
  return json.amount;
}

// Key caching so employer only signs once per session
let cachedKey: CryptoKey | null = null;
let cachedWallet: string | null = null;

export function setCachedKey(key: CryptoKey, wallet: string) {
  cachedKey = key;
  cachedWallet = wallet;
}

export function getCachedKey(wallet: string): CryptoKey | null {
  if (cachedWallet?.toLowerCase() === wallet.toLowerCase()) return cachedKey;
  return null;
}

export function clearCachedKey() {
  cachedKey = null;
  cachedWallet = null;
}

// Utility: request a salary-key signature from the connected wallet
export function getKeyDerivationMessage(walletAddress: string): string {
  return (
    `ZeroPay Confidential — Salary Encryption Key\n\n` +
    `Sign this message to authorize salary computation for your workforce.\n\n` +
    `This signature is used locally to encrypt/decrypt salary data.\n` +
    `It never leaves your browser.\n\n` +
    `Wallet: ${walletAddress}\n` +
    `App: ZeroPay Confidential Payroll`
  );
}

function arrayToBase64(arr: Uint8Array): string {
  return btoa(Array.from(arr, c => String.fromCharCode(c)).join(''));
}

function base64ToArray(b64: string): Uint8Array {
  return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
}
