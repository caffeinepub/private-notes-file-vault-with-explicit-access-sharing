# Specification

## Summary
**Goal:** Make mainnet deployments re-runnable by persisting the resulting backend and frontend canister IDs in a stable, machine-readable file for later retrieval.

**Planned changes:**
- Update `frontend/scripts/deploy-ic.sh` to write a deterministic artifact file under `frontend/deploy-logs/` on every successful mainnet deployment.
- Store at minimum: backend canister ID, frontend canister ID, deployment timestamp, and computed frontend URL in the artifact.
- Keep existing stdout printing of canister IDs, and ensure the artifact mirrors the same values.
- Add safeguards so that if either canister ID cannot be determined, the script does not overwrite the last-known-good artifact and prints a clear warning with manual retrieval commands (`dfx canister id ... --network ic`).

**User-visible outcome:** After running `frontend/scripts/deploy-ic.sh`, users can reliably retrieve the most recently deployed mainnet backend/frontend canister IDs (plus timestamp and frontend URL) from a consistent file in `frontend/deploy-logs/` without relying on console output.
