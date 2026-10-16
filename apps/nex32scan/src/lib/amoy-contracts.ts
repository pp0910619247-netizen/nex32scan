/**
 * Contracts this project has deployed to Polygon Amoy (chain 80002).
 *
 * Public data by construction — an address is visible to anyone watching the
 * chain, so nothing here is a secret. The authoritative record, including
 * deploy tx hashes and the setup calls that followed them, lives in
 * `packages/contracts/deployments/amoy.json`; keep the two in step whenever a
 * new deployment happens.
 *
 * Testnet only (AGENTS.md §1): these addresses hold no real value and the
 * explorer links point at the Amoy block explorer, never at mainnet.
 */

/** Polygon Amoy testnet — the only network this project deploys to. */
export const AMOY_CHAIN_ID = 80_002;

/** Amoy block explorer base URL (testnet, chain 80002). */
export const AMOY_EXPLORER_URL = 'https://amoy.polygonscan.com';

export interface AmoyDeployment {
  /** Contract name as it appears in the Solidity source. */
  readonly name: string;
  /** Lowercase address — case carries no meaning here. */
  readonly address: string;
  /** Hash of the contract-creation transaction. */
  readonly deployTx: string;
}

/** Deployed 2026-10-12 by the Amoy deployment key. */
export const AMOY_DEPLOYMENTS: readonly AmoyDeployment[] = [
  { name: 'NexToken', address: '0x0892d2157e00924f9cc9ae8b94cc50018d4dc7f7', deployTx: '0x52dc6f6c02190fcb098bce034420ee029a7f5dff81510c33de0fdad65a9894c5' },
  { name: 'ImpactTreasury', address: '0x0157d3bb64e379a5615b0259513ba7f940698c7a', deployTx: '0xb1e5439c36d920bb5873e6706b40131e823b58692462255cb4a0fd92f9395f6c' },
  { name: 'NexusMining', address: '0x62dcf14c9a1258b912657de7cacdd50d32769187', deployTx: '0x23ecb5ad321e2d622aefa9fceb98fa169d0445551bd9765b4ce90991945a5d71' },
  { name: 'TeamVesting', address: '0x614d5f95d7c5facd3cd2e297dcfaac57413fdef3', deployTx: '0x00ba9488e61fd63f0cffbcc05b46fe6ad55b1568a21429ffc8bf57257b9f0bac' },
  { name: 'MilestoneAnchor', address: '0x91e265e9b34bdc87af96013a17129a7d69948784', deployTx: '0x70006e4a62f28fe2296217dbbc09fe82f0240a7e222289699e179b3d2f20e809' },
  { name: 'QuizQuestionSet', address: '0x4bbd14c40e009e9dd328d84f3a081eb3575554df', deployTx: '0xc04a70b5cd9c69fabbfffff77e14b3a2a1f499c354053ee1c05787cc849fb44f' },
];

/** Explorer URL for an address on Amoy. */
export function amoyAddressUrl(address: string): string {
  return `${AMOY_EXPLORER_URL}/address/${address}`;
}

/** Explorer URL for a transaction on Amoy. */
export function amoyTxUrl(hash: string): string {
  return `${AMOY_EXPLORER_URL}/tx/${hash}`;
}
