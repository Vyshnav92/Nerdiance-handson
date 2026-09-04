#!/bin/bash
# Simulates a Pod Crash Loop by patching the deployment with an invalid start command.
echo "Triggering CrashLoopBackOff on handson-app..."
kubectl patch deployment handson-app --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/command","value":["node","this-file-does-not-exist.js"]}]'
echo "Watch status with: kubectl get pods -w"
echo "To recover: kubectl rollout undo deployment/handson-app"
