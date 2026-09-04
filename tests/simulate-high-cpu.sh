#!/bin/bash
# Simulates high CPU usage by running a busy-loop inside the app pod.
POD=$(kubectl get pods -l app.kubernetes.io/name=handson-app -o jsonpath='{.items[0].metadata.name}')
echo "Injecting CPU stress into pod: $POD"
echo "Run this manually inside the pod (kubectl exec -it $POD -- sh), then:"
echo '  node -e "while(true) {}"'
echo "To stop: Ctrl+C inside the pod shell, then exit."
