import { describe, expect, it } from 'vitest';
import { AMOY_CHAIN_ID, AMOY_DEPLOYMENTS, amoyAddressUrl, amoyTxUrl } from './amoy-contracts';

describe('amoy deployment list', () => {
  it('pins the network to Amoy testnet, never mainnet', () => {
    expect(AMOY_CHAIN_ID).toBe(80_002);
    for (const url of [amoyAddressUrl('0xabc'), amoyTxUrl('0xdef')]) {
      // Host, not substring: `polygonscan.com` is the mainnet explorer, while
      // the Amoy one is the `amoy.` subdomain — only the second is allowed.
      expect(new URL(url).host).toBe('amoy.polygonscan.com');
      expect(new URL(url).protocol).toBe('https:');
    }
  });

  it('holds well-formed, unique addresses and tx hashes', () => {
    const addresses = new Set<string>();
    for (const entry of AMOY_DEPLOYMENTS) {
      expect(entry.name.trim().length).toBeGreaterThan(0);
      expect(entry.address, entry.name).toMatch(/^0x[0-9a-f]{40}$/);
      expect(entry.deployTx, entry.name).toMatch(/^0x[0-9a-f]{64}$/);
      expect(addresses.has(entry.address), `duplicate ${entry.address}`).toBe(false);
      addresses.add(entry.address);
    }
    // The set we actually deployed: token, treasury, mining, vesting, anchor, quiz.
    expect(AMOY_DEPLOYMENTS.length).toBe(6);
  });

  it('renders plain text — no address or tx placeholder is left unresolved', () => {
    const zero = AMOY_DEPLOYMENTS.find((entry) => /^0x0{40}$/.test(entry.address));
    expect(zero).toBeUndefined();
    expect(amoyAddressUrl('0x0892d2157e00924f9cc9ae8b94cc50018d4dc7f7')).toBe(
      'https://amoy.polygonscan.com/address/0x0892d2157e00924f9cc9ae8b94cc50018d4dc7f7',
    );
  });
});
