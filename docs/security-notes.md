# Security Notes

## Secrets handling
- No secrets are committed to this repository.
- Kubernetes Secrets (DB_PASSWORD) are injected at deploy-time via
  `--set` (manual) or GitHub Actions secrets (`DOCKERHUB_TOKEN`, `KUBE_CONFIG`,
  `DB_PASSWORD`), never hardcoded in values.yaml or any tracked file.
- Docker Hub authentication uses a scoped access token, not an account password.
- GitHub push authentication uses a Personal Access Token (classic, `repo` scope
  only), rotated during this project.

## Network exposure
- Kubernetes API (port 6443) is opened to 0.0.0.0/0 on the EC2 Security Group
  to allow GitHub Actions runners (dynamic IPs) to deploy via Helm.
  - Mitigation: the k3s API still requires a valid client certificate for any
    request; network reachability alone does not grant access.
  - Production recommendation: restrict to GitHub's published IP ranges, or
    use a self-hosted Actions runner inside the VPC instead of exposing the
    API publicly at all.
- SSH (port 22) is similarly open broadly for convenience during this
  timeboxed exercise; production setups should restrict to known IPs or use
  a bastion host.

## Container security
- Application container runs as a non-root user (`USER node` in Dockerfile).
- Base image is `node:20-alpine` - minimal surface area vs a full OS image.
- No image scanning (e.g., Trivy, Grype) is currently wired into CI; noted as
  a improvement for production readiness.

## RBAC
- Default k3s RBAC is in use; no custom ServiceAccounts with elevated
  permissions were created for the application itself.
- The kubeconfig used by GitHub Actions carries full cluster-admin level
  access (from the default k3s config) - in production this should be
  narrowed to a scoped ServiceAccount/Role limited to the `default`
  namespace and Helm-relevant verbs only.

## Known limitations (see RCAs for detail)
- Single-node cluster: no failover, and monitoring/alerting itself goes
  down if the node fails.
- k3s's default CNI (Flannel) does not enforce NetworkPolicy - a planned
  Network Partition scenario was not achievable via NetworkPolicy for this
  reason and was substituted accordingly (see docs/rca-node-failure.md for
  the related node-level scenario actually executed).
