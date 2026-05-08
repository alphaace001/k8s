# Fullstack Application — Kubernetes Architecture

## Overview

A React (Vite) frontend and Express (Node.js) backend running as a multi-container pod in Kubernetes, exposed via an NGINX Ingress Controller.

## Architecture Diagram

```
                        ┌──────────────────────┐
                        │   NGINX Ingress       │
                        │   Controller          │
          HTTP :80      │                       │
 Browser ──────────────►│  /     → frontend     │
                        │  /api  → backend      │
                        └──────────┬────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │  fullstack-service     │
                        │  (ClusterIP)           │
                        │  5173/TCP, 3000/TCP    │
                        └──────────┬────────────┘
                                   │
                   ┌───────────────▼───────────────┐
                   │         Pod: fullstack         │
                   │  ┌───────────┬──────────────┐  │
                   │  │ frontend  │   backend     │  │
                   │  │ :5173     │   :3000       │  │
                   │  │ Vite dev  │   Express     │  │
                   │  │ Node 22   │   Node 18     │  │
                   │  └───────────┴──────────────┘  │
                   │       Shared localhost          │
                   └────────────────────────────────┘
                                   │
                        ┌──────────▼────────────┐
                        │  fullstack-secret      │
                        │  (Opaque)              │
                        │  PORT                  │
                        │  FRONTEND_BASE_URL     │
                        │  VITE_BACKEND_URL      │
                        └───────────────────────┘
```

## Kubernetes Resources

| Resource | Name | Purpose |
|----------|------|---------|
| Deployment | `fullstack` | Manages the pod with 2 containers (frontend + backend) |
| Service | `fullstack-service` | ClusterIP service exposing ports 5173 and 3000 |
| Ingress | `fullstack-ingress` | Routes `/` to frontend and `/api` to backend via NGINX |
| Secret | `fullstack-secret` | Stores environment variables (PORT, FRONTEND_BASE_URL, VITE_BACKEND_URL) |

## Container Details

### Frontend
- **Image:** `localhost:5000/frontend:v1`
- **Port:** 5173
- **Runtime:** Node 22 + Vite dev server
- **Env:** `VITE_BACKEND_URL` (from secret)

### Backend
- **Image:** `localhost:5000/backend:v1`
- **Port:** 3000
- **Runtime:** Node 18 + Express (ts-node/nodemon)
- **Env:** `PORT`, `FRONTEND_BASE_URL` (from secret)

## Traffic Flow

1. Browser requests `http://localhost/` or `http://localhost/api/*`
2. NGINX Ingress Controller receives the request
3. Routes based on path:
   - `/api` → `fullstack-service:3000` → backend container
   - `/` → `fullstack-service:5173` → frontend container
4. Both containers share the same pod network (can reach each other via `localhost`)

## Commands

```bash
# Apply all resources
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f ingress.yaml

# Build and push images
docker build -t frontend:v1 code/frontend/
docker tag frontend:v1 localhost:5000/frontend:v1
docker push localhost:5000/frontend:v1

docker build -t backend:v1 code/backend/
docker tag backend:v1 localhost:5000/backend:v1
docker push localhost:5000/backend:v1

# Restart deployment
kubectl rollout restart deployment fullstack

# Check status
kubectl get po
kubectl top pod <pod-name> --containers
kubectl logs <pod-name> -c frontend
kubectl logs <pod-name> -c backend

# Port forward ingress (required for Kind clusters)
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 80:80
```

## Access

- **Frontend:** http://localhost/
- **Backend API:** http://localhost/api/ping
