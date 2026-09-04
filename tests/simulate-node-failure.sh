#!/bin/bash
# Simulates a node failure by stopping the k3s service.
echo "Stopping k3s to simulate node failure..."
sudo systemctl stop k3s
echo "Cluster is now down. To recover, run: sudo systemctl start k3s"
