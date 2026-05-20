/**
 * GitHub Secrets Pusher — adds all .env keys to GitHub Actions secrets
 * Uses GitHub REST API with libsodium encryption (required by GitHub)
 */
import { execSync } from 'child_process';
import fs from 'fs';

const OWNER = 'thegalaxylegend';
const REPO  = 'examcompass';

// Get GitHub token from git config or environment
function getGitHubToken(): string {
  // Try git credential helper
  try {
    const result = execSync(
      'git credential fill',
      { input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf-8', timeout: 3000 }
    );
    const match = result.match(/password=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  // Try environment
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '';
}

// Fetch repo public key for secret encryption
async function getPublicKey(token: string) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/secrets/public-key`,
    { headers: { Authorization: `Bearer ${token}`, 'X-GitHub-Api-Version': '2022-11-28' } }
  );
  if (!res.ok) throw new Error(`Failed to get public key: ${res.status} ${await res.text()}`);
  return await res.json() as { key_id: string; key: string };
}

// Encrypt secret using libsodium (via node --experimental or tweetnacl)
async function encryptSecret(publicKeyBase64: string, secretValue: string): Promise<string> {
  // Use tweetnacl-sealedbox or sodium-native — check what's available
  // Simplest: use the GitHub CLI if available
  try {
    const result = execSync(
      `node -e "
        const {box, randomBytes} = require('tweetnacl');
        const {encodeBase64, decodeBase64, decodeUTF8} = require('tweetnacl-util');
        const pk = decodeBase64('${publicKeyBase64}');
        const msg = decodeUTF8(${JSON.stringify(secretValue)});
        const nonce = randomBytes(box.nonceLength);
        const epk = randomBytes(32);
        // sealed box = crypto_box_seal
        process.stdout.write(encodeBase64(require('libsodium-wrappers').crypto_box_seal(msg, pk)));
      "`,
      { encoding: 'utf-8' }
    );
    return result.trim();
  } catch {}
  return '';
}

async function setSecret(token: string, keyId: string, encryptedValue: string, secretName: string) {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/actions/secrets/${secretName}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({ encrypted_value: encryptedValue, key_id: keyId })
    }
  );
  return res.status === 201 || res.status === 204;
}

console.log('This script requires libsodium. Using gh CLI instead...');
console.log('Checking gh CLI...');

try {
  execSync('gh --version', { encoding: 'utf-8' });
  console.log('✅ gh CLI found');
} catch {
  console.log('❌ gh CLI not found. Install from: https://cli.github.com/');
  process.exit(1);
}
