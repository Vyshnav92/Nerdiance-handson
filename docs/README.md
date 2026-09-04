# docs/ - Incident Documentation Index

## RCA & Postmortem (one per simulated incident)
- [rca-pod-crashloop.md](rca-pod-crashloop.md) - Pod Crash Loop
- [rca-node-failure.md](rca-node-failure.md) - Node Failure
- [rca-high-cpu.md](rca-high-cpu.md) - High CPU / Resource Exhaustion

Each RCA follows: Summary, Timeline, 5-Whys root cause analysis, Detection
method, Evidence, Corrective Actions (with owner), and Recovery.

## Runbook
- [runbook.md](runbook.md) - Step-by-step remedial actions for common
  incidents: pod restart, rollback, scaling, CrashLoopBackOff triage,
  high CPU/memory triage, connectivity issues, and node failure recovery.

## Security
- [security-notes.md](security-notes.md) - Secrets handling, network
  exposure decisions and mitigations, container security, RBAC posture,
  and known architectural limitations.
