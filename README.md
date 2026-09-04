# Nerdience HandsOn SRE Intern Evaluation - Submission

**Candidate:** Vaishnav S Nair
**Role:** SRE Intern
**Company:** Nerdience Technologies Pvt Ltd

## 1. Architecture Overview
                    ┌─────────────────────────────┐
                    │   GitHub Repository          │
                    │  (code, Helm chart, CI/CD)   │
                    └───────────────┬───────────────┘
                                    │ git push
                                    ▼
                    ┌─────────────────────────────┐
                    │   GitHub Actions              │
                    │  1. Build Docker image        │
                    │  2. Push to Docker Hub        │
                    │  3. helm upgrade --install     │
                    └───────┬───────────────┬───────┘
                            │               │
                push image  │               │ deploy via
                            ▼               ▼ kubeconfig secret
                 ┌────────────────┐   ┌──────────────────────────────┐
                 │   Docker Hub    │   │   AWS EC2 (Ubuntu 22.04)      │
                 │  handson-app    │   │   k3s single-node cluster     │
                 └────────────────┘   │                                │
                                       │  ┌──────────────────────────┐ │
                                       │  │ default namespace         │ │
                                       │  │  - handson-app Deployment │ │
                                       │  │  - Service (ClusterIP)    │ │
                                       │  │  - Ingress (Traefik)      │ │
                                       │  │  - ConfigMap / Secret     │ │
                                       │  └──────────────────────────┘ │
                                       │  ┌──────────────────────────┐ │
                                       │  │ monitoring namespace      │ │
                                       │  │  - Prometheus             │ │
                                       │  │  - Grafana                │ │
                                       │  │  - Alertmanager           │ │
                                       │  │  - Loki + Promtail        │ │
                                       │  └──────────────────────────┘ │
                                       └──────────────────────────────┘

**App:** a small Node.js/Express service (`app/server.js`) serving a simple
HTML frontend that calls its own backend API (`/api/info`) via `fetch()`,
plus a `/health` endpoint used for Kubernetes liveness/readiness probes.

**Deployment:** packaged via a custom Helm chart (`charts/handson-app`)
covering Deployment, Service, Ingress, ConfigMap, Secret, resource
requests/limits, and liveness/readiness probes.

**CI/CD:** GitHub Actions (`.github/workflows/ci-cd.yaml`) builds the image
on every push to `master`, tags it with the commit SHA, pushes to Docker
Hub, then runs `helm upgrade --install` against the k3s cluster using a
kubeconfig stored as a GitHub Secret.

**Observability:** `kube-prometheus-stack` (Prometheus, Grafana,
Alertmanager) and `loki-stack` (Loki, Promtail), both installed via Helm
into a separate `monitoring` namespace.

## 2. Assumptions & Deviations from the Assignment

- **Environment:** Deployed on an AWS EC2 instance (Ubuntu 22.04, m7i-flex/c7i-flex.large,
  40GB disk) rather than a local VirtualBox VM. This was a mid-project pivot after
  local VirtualBox display/console access proved impractical within the time budget
  (no usable interactive console, no copy-paste). AWS gave reliable SSH access with
  full terminal functionality. This still satisfies the "single Linux VM" requirement.
- **Registry:** Docker Hub (not GitHub Packages).
- **Network Partition scenario:** Not achievable via standard Kubernetes NetworkPolicy,
  because k3s's default CNI (Flannel) does not enforce NetworkPolicies. iptables-based
  blocking was also attempted but was inconsistent for node-to-pod overlay traffic on a
  single-node cluster. This scenario was substituted with **Node Failure** (also from
  the assignment's approved failure-scenario list), which was executed successfully -
  see `docs/rca-node-failure.md` for full details and the honest limitation this
  revealed (single-node clusters can't self-alert on total node loss).
- **No public cluster exposure:** Per the assignment's explicit either/or ("URL(s)
  or port-forward instructions... OR a short demo video"), this submission uses
  port-forwarding plus a demo video rather than exposing dashboards/endpoints
  publicly, as a deliberate security choice.
- **Demo app:** A minimal Node.js/Express app was used rather than a more complex
  sample microservice, per the assignment's own suggestion ("can use a sample app
  or a small app").
- **Database:** Not used. The assignment lists Postgres/DB access as "Recommended,"
  not required, under Environment. No failure scenario in this submission depends
  on a database (DB connectivity loss was swapped out in favor of Node Failure).

## 3. Setup Steps (Reproduction)

### Prerequisites
- An Ubuntu 22.04 VM/instance with at least 4GB RAM, 2+ vCPU, 40GB disk
- Docker Hub account
- GitHub repository with Actions enabled

### 3.1 Provision k3s
```bash
curl -sfL https://get.k3s.io | sh -
sudo cat /etc/rancher/k3s/k3s.yaml   # kubeconfig
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
kubectl get nodes   # should show Ready
```

### 3.2 Build and push the app image
```bash
cd app
docker build -t <dockerhub-username>/handson-app:latest .
docker login -u <dockerhub-username>
docker push <dockerhub-username>/handson-app:latest
```

### 3.3 Deploy via Helm
```bash
helm install handson-app charts/handson-app \
  --set image.repository=<dockerhub-username>/handson-app \
  --set image.tag=latest \
  --set secret.DB_PASSWORD=<any-placeholder-value>
kubectl get pods   # should show 1/1 Running
```

### 3.4 Install observability stack
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.adminPassword=admin123

helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set promtail.enabled=true
```

### 3.5 Apply alerting rules
```bash
kubectl apply -f observability/prometheus/alerts.yaml
```

### 3.6 Set up CI/CD (GitHub Secrets required)
Add these repository secrets in GitHub (Settings > Secrets and variables > Actions):
- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `KUBE_CONFIG` (raw contents of `~/.kube/config`, with `127.0.0.1` replaced by
  the VM's public/Elastic IP, and the k3s TLS cert regenerated to include that
  IP: `curl -sfL https://get.k3s.io | sh -s - --tls-san <PUBLIC_IP>`)
- `DB_PASSWORD` (placeholder value)

On every push to `master`, the pipeline builds, pushes, and deploys automatically.

## 4. Viewing Dashboards & Alerts

Since no public endpoint is exposed (see Assumptions), use port-forwarding:

```bash
# Grafana
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# then open http://localhost:3000  (user: admin / password: admin123)

# The app itself
kubectl port-forward svc/handson-app 3001:80
# then open http://localhost:3001
```

If connecting from a separate laptop (not the VM itself), tunnel through SSH:
```bash
ssh -i <key.pem> -L 3000:localhost:3000 ubuntu@<PUBLIC_IP>
# then run the kubectl port-forward command inside that same SSH session
```

**Dashboards:** "Cluster Metrics" and "Service Health - HandsOn App," both
under Grafana > Dashboards. JSON exports are in `observability/grafana/`.

**Alerts:** Grafana > Alerting > Alert rules. Custom rules:
`HandsonAppHighCPU`, `HandsonAppCrashLoopBackOff`, `HandsonAppPodRestarts`,
`HandsonAppPodNotReady`.

**Logs:** Grafana > Explore > select Loki data source > query `{app="handson-app"}`.

## 5. Running Failure Simulations

```bash
# Pod Crash Loop
kubectl patch deployment handson-app --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/command","value":["node","this-file-does-not-exist.js"]}]'
# Recover:
kubectl rollout undo deployment/handson-app

# Node Failure
sudo systemctl stop k3s
# Recover:
sudo systemctl start k3s

# High CPU
kubectl exec -it <pod-name> -- sh
node -e "while(true) {}"
# Recover: Ctrl+C inside the pod shell, then `exit`
```

Full timelines, evidence, and analysis for each: see `docs/rca-*.md`.

## 6. Teardown

```bash
helm uninstall handson-app
helm uninstall monitoring -n monitoring
helm uninstall loki -n monitoring
kubectl delete namespace monitoring
sudo /usr/local/bin/k3s-uninstall.sh
```

If using AWS: terminate the EC2 instance and release the Elastic IP to avoid
ongoing charges.

## 7. Repository Structure
handson-app/
├── app/ # Node.js app + Dockerfile
├── charts/handson-app/ # Helm chart
├── .github/workflows/ # CI/CD pipeline
├── observability/ # Prometheus rules, Grafana dashboard JSON, notes
├── tests/ # Failure simulation scripts/manifests
└── docs/ # RCAs, runbook, security notes

## Delivery Information

Estimated delivery: 4 September 2026

The implementation was completed within the allocated evaluation
window.

Assumptions:
- Single-node k3s cluster on AWS EC2
- Docker Hub used as container registry
- Port-forwarding used for dashboard/application access

Deviations:
- None from the required k3s/Helm architecture.
