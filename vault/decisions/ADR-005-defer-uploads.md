---
title: ADR-005 — Defer file uploads, reserve schema
status: accepted
date: 2026-05-07
tags: [decision, storage]
---

# ADR-005 — Defer file uploads, reserve schema

## Context

Three features need user-uploaded files:

- Cleaner profile photo (`Cleaner.photoUrl`) — already in schema
- Review photos (proof of clean / damage)
- Job applicant resumes & document scans

All three need an object-storage decision: AWS S3, Cloud.ru S3, MinIO self-hosted, or local filesystem behind a CDN. This must comply with KZ personal-data residency law (resumes / IDs are personal data → KZ-resident storage required).

That decision is open — see [[../roadmap/open-questions]] item #9.

## Decision

- **Reserve the schema columns now**: `Review.photos String[]`, `JobApplication.resumeUrl String?`, `JobApplication.documentUrls String[]`. These are forward-compatible — no migration churn when the upload pipeline lights up.
- **Skip building the upload pipeline** until storage is chosen.
- The endpoints that *consume* the URLs (read-side) will still work — they just see empty arrays / nulls until uploads are wired.

## Why this split

The schema cost of a column is near-zero. The cost of choosing the wrong storage backend and migrating later (re-uploading, re-signing URLs, breaking links) is high. Schema absorbs the future shape; behavior waits.

## When this gets revisited

Once the client confirms storage choice. At that point:

1. Add an `UploadsModule` with a presign-URL endpoint.
2. Wire it into the review and job-application controllers.
3. No schema change needed.

## Related

- [[../modules/reviews]]
- [[../modules/job-applications]]
- [[../roadmap/open-questions]]
