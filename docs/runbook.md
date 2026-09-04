# Runbook - HandsOn SRE App

## Restart a pod
kubectl delete pod <POD_NAME>
(Deployment automatically recreates it.)

## Roll back a bad deployment
kubectl rollout undo deployment/handson-app
kubectl rollout status deployment/handson-app

## Scale the app
kubectl scale deployment handson-app --replicas=<N>

## Investigate a CrashLoopBackOff
1. kubectl get pods
2. kubectl describe pod <POD_NAME>
3. kubectl logs <POD_NAME> --previous
4. Check Loki: {app="handson-app"} for recent error lines
5. If caused by a bad deploy, roll back (see above)

## Investigate high CPU/memory
1. kubectl top pod
2. Check Grafana Service Health dashboard - CPU/Memory panels
3. Check Alerting -> HandsonAppHighCPU state
4. If sustained and load-related, consider scaling replicas or raising limits
5. If caused by a runaway process/bug, restart the pod

## Investigate network/connectivity issues
1. kubectl get pods -o wide (confirm pod IP and node)
2. kubectl get networkpolicy -A (check for unexpected policies)
3. curl <pod-ip>:<port>/health from the node
4. Check Loki for connection-related errors

## Node failure (single-node cluster)
1. sudo systemctl status k3s
2. sudo systemctl start k3s (if stopped)
3. kubectl get nodes / kubectl get pods -A - confirm recovery
Note: on this single-node setup, no in-cluster alert can fire during a full
node outage (Alertmanager itself is down). Recovery is manual/observational.
