# nex32scan — Nexus Architect block explorer (web)

Bilingual (EN/TH) **read-only block explorer** for the Nexus Architect
knowledge-mining chain on **Polygon Amoy testnet**.
Next.js 14 App Router + TypeScript + TailwindCSS.

This repository contains **only the website build**: the explorer app plus the
two workspace libraries it compiles against (`@nexus/shared` for the locked
tokenomics constants + i18n, `@nexus/indexer` for the read-only data types).
The chain node, smart contracts, and mobile app live in the full Nexus
Architect monorepo and are **not** part of this repository.

## Quickstart

```bash
pnpm install
pnpm build                       # builds @nexus/shared + @nexus/indexer, then the explorer
pnpm dev                         # explorer on http://localhost:3000
```

Gates (same as CI):

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Data modes

The explorer picks its data source automatically (fail-soft, never fakes data):

| Mode | Condition | Use |
| --- | --- | --- |
| `hybrid` | `QUIZ_CHAIN_API_URL` + a baked snapshot | **Recommended** — live node first, snapshot as fallback |
| `remote` | only `QUIZ_CHAIN_API_URL` | node reachable over a tunnel |
| `file` | `INDEXER_SNAPSHOT_PATH` | local run against an exported snapshot |
| `baked` | neither | cloud default — the snapshot baked at build time |

- Run against a local node: set `QUIZ_CHAIN_API_URL=http://localhost:4100` in `apps/nex32scan/.env.local`.
- Refresh the baked snapshot: replace `apps/nex32scan/src/generated/explorer-snapshot.json`
  (produced by the monorepo's `chain:export` + `bake:snapshot` scripts) and commit it.
- `next build` never reads the live node, so prerendered pages stay static.

## Deploy (Vercel)

The live deployment is a Vercel project with **Root Directory = `apps/nex32scan`**
(see `apps/nex32scan/vercel.json` and `DEPLOY.md`). Deploy with:

```bash
pnpm dlx vercel deploy --prod --yes
```

## Links

- Live site: https://nex32scan.vercel.app
- Testnet only — nothing in this repository targets mainnet.

## ภาษาไทย

เว็บเบราว์เซอร์แบบอ่านอย่างเดียวสำหรับเชนขุดความรู้ Nexus Architect (ทดสอบบน Polygon Amoy เท่านั้น)
repo นี้เก็บ **เฉพาะตัวเว็บ** (แอป explorer + ไลบรารีที่เว็บใช้ประกอบ 2 ตัว) — โหนดเชน สัญญา และแอปมือถือ
อยู่ใน monorepo หลัก ไม่ได้อยู่ในที่นี้
รันในเครื่อง: `pnpm install && pnpm build && pnpm dev` แล้วเปิด http://localhost:3000
รายละเอียด deploy ดูที่ `DEPLOY.md`
