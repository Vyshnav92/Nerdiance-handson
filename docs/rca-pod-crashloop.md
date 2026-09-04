# RCA & Postmortem: Pod Crash Loop - handson-app

## Summary
The handson-app pod was intentionally patched to run a non-existent startup
command, causing it to enter CrashLoopBackOff. This validated crash-loop
detection, alerting, and log aggregation end-to-end.

## Timeline (2026-09-04, IST)
- 09:42 - Deployment patched with invalid start command (incident start)
- 09:42 - Pod status observed transitioning: Running -> Error -> CrashLoopBackOff
- 09:43 - Prometheus alert `HandsonAppCrashLoopBackOff` fired (state: Firing)
- 09:44 - Root cause confirmed via Loki logs: "Cannot find module '/app/this-file-does-not-exist.js'"
- 09:46 - Mitigation applied: `kubectl rollout undo deployment/handson-app`
- 09:47 - Pod recovered to 1/1 Running
- 09:48 - Alert cleared back to Normal state

## Root Cause (5 Whys)
1. Why did the pod crash? -> It tried to execute a file that doesn't exist in the container.
2. Why did it try to run that file? -> The Deployment spec was patched with an invalid `command` override.
3. Why was it patched that way? -> Intentional failure injection to test alerting/observability (planned SRE exercise).
4. Why did Kubernetes keep restarting it? -> Default pod restart policy retries failed containers with exponential backoff, producing the CrashLoopBackOff state.
5. Why wasn't this caught before reaching a running state? -> No pre-deploy smoke test validates that the container's start command is valid before rollout.

## Detection
- Prometheus alert rule: `HandsonAppCrashLoopBackOff`
  - Expression: `kube_pod_container_status_waiting_reason{reason="CrashLoopBackOff", pod=~"handson-app.*"} == 1`
  - `for: 1m`
- Time to detection: ~1 minute from crash onset to alert firing, consistent with the rule's `for` threshold.

## Evidence
- Grafana Alerting page: `HandsonAppCrashLoopBackOff` shown in Firing state during the incident window.
- Loki query `{app="handson-app"} |= "Cannot find module"` returned the exact stack trace:
  `Error: Cannot find module '/app/this-file-does-not-exist.js'`, `code: 'MODULE_NOT_FOUND'`.
- Screenshots captured during the live demo (see demo video).

## Corrective Actions
| Action | Owner | Status |
|---|---|---|
| Add CI step to smoke-test container command before deploy | Vaishnav | Proposed |
| Add `helm lint` as a required CI step before deploy job runs | Vaishnav | Proposed |
| Document rollback procedure in runbook.md | Vaishnav | Done |

## Recovery
`kubectl rollout undo deployment/handson-app` reverted the Deployment to its
previous working revision. Pod returned to 1/1 Running within ~1 minute, and
the corresponding Prometheus alert cleared shortly after.
