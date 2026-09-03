# Observability Stack

Installed via Helm:
- kube-prometheus-stack (Prometheus, Grafana, Alertmanager) - namespace: monitoring
- loki-stack (Loki, Promtail) - namespace: monitoring

Install commands:
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace --set grafana.adminPassword=admin123
helm install loki grafana/loki-stack --namespace monitoring --set promtail.enabled=true
