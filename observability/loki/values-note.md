# Loki + Promtail Configuration

Installed via the `grafana/loki-stack` Helm chart with default values plus:
helm install loki grafana/loki-stack
--namespace monitoring
--set promtail.enabled=true

Promtail runs as a DaemonSet, automatically discovering and shipping logs
from all pods in the cluster (including handson-app) to Loki using
Kubernetes' standard pod-log auto-discovery - no manual scrape config was
required beyond enabling the promtail sub-chart.

Loki is queried via Grafana's Explore view using LogQL, e.g.:
{app="handson-app"}
