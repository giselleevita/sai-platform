# Changesets by category (review links)

These branches are **category pointers** to commits already on `main`.
Use the compare links below to review each changeset as a PR-style diff (parent → commit).

## Chore

- `chore/reports-ignore` (`a634dcf`): chore: ignore generated reports output  
  `https://github.com/giselleevita/sai-platform/compare/ac3dfd5f8487f1dcaead795a262dfffb25a92356...a634dcf8d40de1c4f32b6edab483a96a4fa1aaf0`

## CI

- `ci/sprint-smoke` (`899d0ca`): P1: Add CI sprint smoke job for API + Postgres  
  `https://github.com/giselleevita/sai-platform/compare/3a57c3146f1130961d71c0a9dde7bded00e9068d...899d0caacd4f176750896204bbe36f2402223650`

## Docs / Web

- `docs/web-and-diligence` (`d40c770`): P2: Update web UI flows and documentation  
  `https://github.com/giselleevita/sai-platform/compare/46af1b4d299adcffd3f5478193dba8c1634a423c...d40c7705c34ed651c87bf10db07d0a261599caa9`

## Tests

- `test/tenant-coverage` (`46af1b4`): P1: Update test setup and add coverage for tenant-scoped features  
  `https://github.com/giselleevita/sai-platform/compare/88f3f578f3d28e5130933b586f170e8cc22cf445...46af1b4d299adcffd3f5478193dba8c1634a423c`

## Ops

- `ops/scheduling-safety` (`88f3f57`): P1: Improve ops safety for scheduling, caching, and compliance data  
  `https://github.com/giselleevita/sai-platform/compare/45491ba394b023d83b46de3d7b07bf5fd0933d18...88f3f578f3d28e5130933b586f170e8cc22cf445`

## Performance

- `perf/hotpath-bounds` (`e6d44bb`): P1: Add server-side bounds to hot-path list and export endpoints  
  `https://github.com/giselleevita/sai-platform/compare/fbd864ebb324d3410110eb82c4ac55806159d26a...e6d44bb526c795575a91b4c73cdbe5d36f8a77f1`

## Features

- `feat/tenant-foundation` (`0456fff`): P1: Add tenant foundation user memberships and user/invite APIs  
  `https://github.com/giselleevita/sai-platform/compare/13bd1a3309442d88f60a1b62ed5d0f43c6d69f88...0456fffb689004f0b012c953418ff761f86e4f55`
- `feat/oidc-sso` (`3a57c31`): P1: Add OIDC SSO login flow (API + web)  
  `https://github.com/giselleevita/sai-platform/compare/cc714366d0cb9230e695bd6c06b9cd858f493e72...3a57c3146f1130961d71c0a9dde7bded00e9068d`
- `feat/sso-scim` (`6f47c23`): P1: Add tenant SSO config and SCIM user provisioning  
  `https://github.com/giselleevita/sai-platform/compare/0456fffb689004f0b012c953418ff761f86e4f55...6f47c23e3d35225753a7b12cd7715794d073abaa`
- `feat/evidentia-hardening` (`5dab24e`): P1: Harden Evidentia integration and add idempotent sync  
  `https://github.com/giselleevita/sai-platform/compare/6f47c23e3d35225753a7b12cd7715794d073abaa...5dab24eb280e83ff26b81134a4484eb74b09cf61`
- `feat/entitlements` (`45491ba`): P1: Add entitlements and enforce key plan limits  
  `https://github.com/giselleevita/sai-platform/compare/5dab24eb280e83ff26b81134a4484eb74b09cf61...45491ba394b023d83b46de3d7b07bf5fd0933d18`
- `feat/attachments-storage` (`fbd864e`): P0: Harden evidence attachments storage and lifecycle  
  `https://github.com/giselleevita/sai-platform/compare/6da13cd64bac14ba0e9a2cbaf650c8c40861aed4...fbd864ebb324d3410110eb82c4ac55806159d26a`
- `feat/scheduled-reports` (`19cd246`): P0: Persist scheduled reports and initialize scheduler on boot  
  `https://github.com/giselleevita/sai-platform/compare/cb72685e6a4d3b407e8a51bb3d5145bffb310b49...19cd2468742f66e4931fef8ca6910402b654e6f8`
- `feat/activity-normalization` (`055bc04`): P1: Normalize activity feed type mapping and filtering  
  `https://github.com/giselleevita/sai-platform/compare/69bb171022ef331944b05037aab9e1fb78000fb3...055bc042588e0a5c6bab79bfb6a340e201c0a149`
- `feat/bulk-soft-delete` (`69bb171`): P1: Make bulk deletes consistent with soft-delete semantics  
  `https://github.com/giselleevita/sai-platform/compare/5f6aa31c532d9e9bc2f99da12a227ec8ac35576f...69bb171022ef331944b05037aab9e1fb78000fb3`
- `feat/api-finalize` (`ac3dfd5`): P1: Finalize API controllers, validation, and remaining migrations  
  `https://github.com/giselleevita/sai-platform/compare/d40c7705c34ed651c87bf10db07d0a261599caa9...ac3dfd5f8487f1dcaead795a262dfffb25a92356`

## Fixes

- `fix/migrations-cleanroom` (`bb97652`): P0: Fix clean-room migrations for roles and refresh tenant  
  `https://github.com/giselleevita/sai-platform/compare/899d0caacd4f176750896204bbe36f2402223650...bb97652182a073b6b8191d7c0b0d47cd48a9575c`
- `fix/auth-tenant-stability` (`0c5f05e`): P0: Stabilize tenant context for refresh and OIDC  
  `https://github.com/giselleevita/sai-platform/compare/bb97652182a073b6b8191d7c0b0d47cd48a9575c...0c5f05e17fc8824ece349ba0fcc7fd95ec5576df`
- `fix/webhooks-ssrf` (`6da13cd`): P0: Add webhook SSRF allowlist and safer request logging  
  `https://github.com/giselleevita/sai-platform/compare/0c5f05e17fc8824ece349ba0fcc7fd95ec5576df...6da13cd64bac14ba0e9a2cbaf650c8c40861aed4`
- `fix/status-normalization` (`5f6aa31`): P0: Normalize evidence and governance statuses (compat-first)  
  `https://github.com/giselleevita/sai-platform/compare/19cd2468742f66e4931fef8ca6910402b654e6f8...5f6aa31c532d9e9bc2f99da12a227ec8ac35576f`
- `fix/csv-import-hardening` (`cc71436`): P2: Harden CSV import parsing and align docs with runtime  
  `https://github.com/giselleevita/sai-platform/compare/055bc042588e0a5c6bab79bfb6a340e201c0a149...cc714366d0cb9230e695bd6c06b9cd858f493e72`
- `fix/frontend-session-ux` (`13bd1a3`): P1: Harden frontend session handling and org switching UX  
  `https://github.com/giselleevita/sai-platform/compare/e6d44bb526c795575a91b4c73cdbe5d36f8a77f1...13bd1a3309442d88f60a1b62ed5d0f43c6d69f88`

