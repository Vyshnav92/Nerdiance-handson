# RCA: Node Failure - Single-Node k3s Cluster

## Summary
The k3s service was intentionally stopped on the sole cluster node to simulate
a node failure. This is a supplementary scenario documenting a real
architectural limitation of single-node clusters: when the node fails, the
entire observability stack (Prometheus, Grafana, Alertmanager, Loki) fails
with it, meaning no alert can fire and no logs can be queried during the
outage itself.

## Timeline (2026-09-04, IST)
- 10:42 - `sudo systemctl stop k3s` executed (incident start)
- 10:42 - Grafana port-forward session immediately dropped ("lost connection to pod")
- 10:42 - `kubectl get pods` began failing with connection-refused errors
- 10:42 - Confirmed via `systemctl status k3s`: service inactive/dead
- 10:4X - `sudo systemctl start k3s` executed (mitigation)
- 10:4X - `kubectl get nodes` returned `Ready` again (recovery)
- 10:4X - All system pods (CoreDNS, Traefik, Prometheus, Grafana, Loki) and
  the handson-app pod gradually returned to `Running` state

## Root Cause (5 Whys)
1. Why did the entire cluster become unreachable? -> The k3s service (control
   plane + kubelet, combined in single-node mode) was stopped.
2. Why did stopping k3s take down monitoring too? -> Prometheus, Grafana,
   Alertmanager, and Loki all run as pods scheduled on this same single node -
   there is no separate control plane or secondary node to fail over to.
3. Why is there only one node? -> This is a PoC/assignment environment sized
   for a single VM per the assignment's environment requirements, not a
   production HA topology.
4. Why couldn't Prometheus alert on this failure? -> Alertmanager itself is a
   pod on the same node; when the node dies, the alerting pipeline dies too -
   a system cannot reliably alert on its own total failure.
5. Why does this matter? -> It reveals a structural blind spot: single-node
   clusters have no mechanism to detect or notify on total node loss from
   within the cluster itself. External, out-of-band monitoring is required
   to catch this class of failure in a real environment.

## Detection
- **No Prometheus alert fired** and **no Loki logs are available** for this
  incident window - this is the key finding, not an omission. Detection was
  manual, via direct `kubectl` and `systemctl` commands from an operator
  session already connected to the node.
- In a production multi-node setup, this gap is normally closed by an
  external monitor (e.g., an uptime check, or Alertmanager/Prometheus
  running on a separate node/cluster) watching node health from outside the
  affected node.

## Evidence
- Terminal transcript showing the Grafana port-forward tunnel dying
  immediately upon `systemctl stop k3s` ("lost connection to pod", repeated
  "connection refused" on reconnect attempts).
- `kubectl get pods` / `kubectl get nodes` failing with connection errors
  during the outage window.
- `systemctl status k3s` showing inactive/dead state.

## Corrective Actions
| Action | Owner | Status |
|---|---|---|
| Document this as a known limitation of the current single-node architecture | Vaishnav | Done (this RCA) |
| Recommend: for production, run Alertmanager/monitoring on a separate node or external service so node-down events are still observable | Vaishnav | Proposed |
| Recommend: add an external, out-of-cluster uptime check (e.g., a simple cron/cloud health check hitting the ingress endpoint) as a compensating control | Vaishnav | Proposed |

## Recovery
`sudo systemctl start k3s`
