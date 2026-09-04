# Prometheus Configuration

## Scrape configuration
Scraping is handled automatically by the `kube-prometheus-stack` Helm chart
via its built-in ServiceMonitor/PodMonitor CRDs - Prometheus discovers and
scrapes all pods in the cluster (including handson-app, kube-state-metrics,
and node-exporter) without manual scrape_config edits. No custom
ServiceMonitor was required since the default cluster-wide discovery already
covers this application.

## Alerting rules
See `alerts.yaml` - 4 custom rules for handson-app (High CPU, CrashLoopBackOff,
Pod Restarts, Pod Not Ready), applied as a PrometheusRule CRD.

## Recording rules
See `recording-rules.yaml` - precomputed CPU usage rate and restart-count
increase for handson-app, reducing repeated query cost on dashboards.
