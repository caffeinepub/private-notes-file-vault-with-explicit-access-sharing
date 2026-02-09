# Specification

## Summary
**Goal:** Make the IC mainnet deployment flow reliably perform a fresh backend/frontend deployment, always output correct canister IDs for `--network ic`, and provide clear post-deploy verification and troubleshooting guidance.

**Planned changes:**
- Update `frontend/scripts/deploy-ic.sh` to perform an end-to-end mainnet deploy that creates required canisters on `--network ic` when missing, then installs/upgrades them, and fails with clear step-specific, actionable errors (e.g., insufficient cycles, controller mismatch).
- Ensure the deploy script continues writing timestamped logs under `frontend/deploy-logs/`, and includes the failing step name plus captured `dfx` output on failure.
- Enhance successful deploy output (stdout + log) to always print the backend and frontend canister IDs sourced from `dfx` for `--network ic`, and include a deterministic “Verify” section with post-deploy commands/URLs (e.g., `dfx canister status backend --network ic` and a backend reachability hint).
- Expand `frontend/DEPLOYMENT_IC.md` with complete copy-pastable mainnet deployment steps (including the exact command to run `frontend/scripts/deploy-ic.sh`), plus guidance to record canister IDs and verify them with `dfx`.
- Add troubleshooting documentation in `frontend/DEPLOYMENT_IC.md` for (1) NNS “canister not found” when linking an ID and (2) IC0508 “canister is stopped”, including verification steps to distinguish not deployed vs stopped vs wrong network.

**User-visible outcome:** Running the mainnet deploy script on a clean setup will create and deploy the canisters (or fail with clear, logged reasons), and users will see the correct mainnet canister IDs plus concrete verification steps/URLs and troubleshooting guidance in the deployment docs.
