# RCA & Postmortem: High CPU Usage - handson-app

## Summary
A CPU-intensive infinite loop was manually executed inside the handson-app
container to simulate a high-CPU-usage incident. This validated CPU-based
alerting and dashboard visibility while keeping the full observability
stack (Prometheus, Grafana, Loki) alive and functional throughout - unlike
the node failure scenario, this is a contained, single-pod failure.

## Timeline (2026-09-04, IST)
- 10:58 - `node -e "while(true) {}"` executed inside the app container (incident start)
- 10:59 - CPU usage climbed from baseline (~0.20 cores) and plateaued above threshold
- 11:00 - Prometheus alert `HandsonAppHighCPU` transitioned Normal -> Pending
- 11:02 - Alert transitioned Pending -> Firing (after sustained 2-minute threshold)
- 11:06 - Mitigation: stress loop terminated (Ctrl+C, exited pod shell)
- 11:07 - CPU usage returned to baseline
- 11:08 - Alert cleared back to Normal

## Root Cause (5 Whys)
1. Why did CPU usage spike? -> An infinite busy-loop was executed inside the container.
2. Why was this loop running? -> Intentional failure injection to validate CPU alerting.
3. Why did CPU usage plateau instead of climbing further? -> The pod's `resources.limits.cpu: 250m` in the Helm chart capped it.
4. Why did the app continue accepting some traffic during the spike? -> Single-threaded event-loop-blocking loop still allowed the Kubernetes-level container process to be scheduled up to its CPU limit; no OOM/kill occurred since memory was unaffected.
5. Why wasn't this caught earlier? -> No pre-existing CPU-based alert had been validated end-to-end before this exercise.

## Detection
- Prometheus alert rule: `HandsonAppHighCPU`
  - Expression: `rate(container_cpu_usage_seconds_total{pod=~"handson-app.*"}[5m]) > 0.2`
  - `for: 2m`
- Time to detection: ~2 minutes from sustained spike to Firing state, matching the rule's configured threshold.
- Grafana graph confirms a clean step-up from baseline (~0.20) at 10:58:30, sustained through the firing window.

## Evidence
- Grafana Alerting page: `HandsonAppHighCPU` panel showing Firing state with query graph (0.20 -> 0.25+ plateau).
- `kubectl top pod` readings showing sustained ~251m CPU (above the 250m configured limit) during the incident.
- Loki logs queried during the incident showed no application-level errors, confirming the app itself remained functionally healthy - it was a resource-pressure event, not an application failure.

## Corrective Actions
| Action | Owner | Status |
|---|---|---|
| Consider a HorizontalPodAutoscaler for CPU-bound scaling in production | Vaishnav | Proposed |
| Add a runbook step for high-CPU triage (see runbook.md) | Vaishnav | Done |
| Review whether current resource limits are appropriately sized for real traffic | Vaishnav | Proposed |

## Recovery
Terminating the stress process returned CPU usage to baseline within
seconds. The Prometheus alert cleared to Normal within the following
evaluation cycle, with no manual pod restart required.
