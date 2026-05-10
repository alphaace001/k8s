# Kubernetes Stack - Stress Test Results

## Overview

Three simple HTTP servers (Rust, Node.js, Python) deployed on Kubernetes, stress-tested under various resource limits, concurrency configurations, and workload types.

| Server  | Framework         | Port | Concurrency Model                         |
| ------- | ----------------- | ---- | ----------------------------------------- |
| Rust    | actix-web 4.9     | 8081 | Multi-threaded async (thread per core)    |
| Node.js | Express           | 3000 | Single-threaded event loop / Cluster mode |
| Python  | FastAPI + Uvicorn | 8000 | Single worker / Multi-worker (4)          |

---

# Part 1: Tests

## Static Response Tests (`GET /`)

### Test 1: No Resource Limits (1,000 requests, 50 concurrent)

Single worker mode for all servers.

| Metric              | Rust   | Node.js | Python |
| ------------------- | ------ | ------- | ------ |
| **Requests/sec**    | 11,411 | 2,330   | 984    |
| **Total time**      | 0.087s | 0.429s  | 1.016s |
| **Avg latency**     | 3.3ms  | 13.7ms  | 50.3ms |
| **50th percentile** | 0.5ms  | 6.8ms   | 26.6ms |
| **Slowest**         | 38ms   | 329ms   | 489ms  |

---

### Test 2: 250m CPU, 128Mi Memory (50,000 requests, 100 concurrent)

Single worker mode.

| Metric              | Rust   | Node.js | Python |
| ------------------- | ------ | ------- | ------ |
| **Requests/sec**    | 9,540  | 822     | 527    |
| **Total time**      | 5.2s   | 60.8s   | 94.8s  |
| **Avg latency**     | 10.4ms | 118ms   | 189ms  |
| **50th percentile** | 2.8ms  | 100.8ms | 193ms  |
| **95th percentile** | 60.7ms | 198ms   | 280ms  |
| **Slowest**         | 65ms   | 9.8s    | 992ms  |

---

### Test 3: 1 CPU, 1Gi Memory — Single Worker (50,000 requests, 100 concurrent)

| Metric              | Rust   | Node.js | Python |
| ------------------- | ------ | ------- | ------ |
| **Requests/sec**    | 35,924 | 3,391   | 1,922  |
| **Total time**      | 1.4s   | 14.7s   | 26.0s  |
| **Avg latency**     | 2.8ms  | 28.4ms  | 51.9ms |
| **50th percentile** | 2.6ms  | 25.3ms  | 51.0ms |
| **95th percentile** | 3.9ms  | 42.6ms  | 62.9ms |
| **Slowest**         | 71ms   | 2.1s    | 145ms  |

---

### Test 4: 1 CPU, 1Gi Memory — Multi-Worker (50,000 requests, 100 concurrent)

- Python: 4 uvicorn workers
- Node.js: cluster mode

| Metric           | Rust   | Node.js (cluster) | Python (4 workers) |
| ---------------- | ------ | ----------------- | ------------------ |
| **Requests/sec** | 35,924 | 3,081             | 1,834              |
| **Total time**   | 1.4s   | 16.2s             | 27.2s              |
| **Avg latency**  | 2.8ms  | 27.0ms            | 54.2ms             |

> Multi-worker on 1 CPU hurt performance: Node.js -9%, Python -5% due to context switching overhead.

---

### Test 5: 4 CPUs, 2Gi Memory — Multi-Worker (50,000 requests, 100 concurrent)

| Metric              | Rust   | Node.js (cluster) | Python (4 workers) |
| ------------------- | ------ | ----------------- | ------------------ |
| **Requests/sec**    | 32,849 | 3,579             | 1,841              |
| **Total time**      | 1.5s   | 14.0s             | 27.2s              |
| **Avg latency**     | 3.0ms  | 27.0ms            | 54.2ms             |
| **50th percentile** | 2.6ms  | 25.5ms            | 53.8ms             |
| **95th percentile** | 6.5ms  | 34.9ms            | 62.8ms             |
| **Slowest**         | 123ms  | 1.8s              | 153ms              |

> Adding more CPUs didn't help much — the workload is too lightweight to benefit from parallelism.

---

## CPU-Bound Tests (`GET /compute`)

Each server counts primes up to 50,000 using trial division — a pure CPU-intensive task.

| Server  | Parallelism Strategy                                         |
| ------- | ------------------------------------------------------------ |
| Rust    | `web::block()` — offloads CPU work to a blocking thread pool |
| Node.js | Cluster mode — forks a worker process per CPU core           |
| Python  | 4 uvicorn workers — separate processes for parallel requests |

---

### Test 6: 4 CPUs — Blocking Async (5,000 requests, 100 concurrent)

Rust with CPU work inside `async fn` (no `web::block()`).

| Metric              | Rust  | Node.js (cluster) | Python (4 workers) |
| ------------------- | ----- | ----------------- | ------------------ |
| **Requests/sec**    | 1,278 | 1,092             | 83                 |
| **Total time**      | 3.9s  | 4.6s              | 59.9s              |
| **Avg latency**     | 77ms  | 81ms              | 962ms              |
| **50th percentile** | 65ms  | 77ms              | 716ms              |
| **95th percentile** | 146ms | 104ms             | 2.17s              |
| **Slowest**         | 269ms | 1.23s             | 2.84s              |

> Rust ≈ Node.js here because blocking the async runtime prevented effective parallelism.

---

### Test 7: 4 CPUs — Proper Parallelism (5,000 requests, 100 concurrent)

Rust with `web::block()` offloading CPU work to the thread pool.

| Metric              | Rust (web::block) | Node.js (cluster) | Python (4 workers) |
| ------------------- | ----------------- | ----------------- | ------------------ |
| **Requests/sec**    | 1,762             | 1,092             | 83                 |
| **Total time**      | 2.8s              | 4.6s              | 59.9s              |
| **Avg latency**     | 55ms              | 81ms              | 962ms              |
| **50th percentile** | 55ms              | 77ms              | 716ms              |
| **95th percentile** | 104ms             | 104ms             | 2.17s              |
| **Slowest**         | 190ms             | 1.23s             | 2.84s              |

### Impact of `web::block()` on Rust

| Metric           | Blocking async | web::block() | Improvement    |
| ---------------- | -------------- | ------------ | -------------- |
| **Requests/sec** | 1,278          | 1,762        | **+38%**       |
| **Total time**   | 3.9s           | 2.8s         | **28% faster** |
| **Avg latency**  | 77ms           | 55ms         | **29% lower**  |

---

## Memory Usage (from Grafana)

### At deployment (idle)

| Pod     | Memory   |
| ------- | -------- |
| Rust    | 4 MiB    |
| Nginx   | 15.2 MiB |
| Node.js | 15 MiB   |
| Python  | 42 MiB   |

### After stress tests 

| Pod     | Memory   | Growth from deploy |
| ------- | -------- | ------------------ |
| Rust    | 5.5 MiB  | +1.5 MiB           |
| Nginx   | 15.2 MiB | ~0                 |
| Node.js | 144 MiB  | +129 MiB (9.6x)    |
| Python  | 165 MiB  | +123 MiB (3.9x)    |

> Rust's ownership model frees memory deterministically — no GC, no bloat. V8 and Python's allocators hold onto memory after load spikes.

### Projected memory at 100 pods

| Server  | Memory   |
| ------- | -------- |
| Rust    | ~550 MiB |
| Node.js | ~14 GiB  |
| Python  | ~16 GiB  |

---

# Part 2: Results & Insights

## All Tests at a Glance (Requests/sec)

| Test | Workload | CPU      | Workers          | Rust   | Node.js | Python |
| ---- | -------- | -------- | ---------------- | ------ | ------- | ------ |
| 1    | Static   | No limit | Single           | 11,411 | 2,330   | 984    |
| 2    | Static   | 250m     | Single           | 9,540  | 822     | 527    |
| 3    | Static   | 1 CPU    | Single           | 35,924 | 3,391   | 1,922  |
| 4    | Static   | 1 CPU    | Multi            | 35,924 | 3,081   | 1,834  |
| 5    | Static   | 4 CPUs   | Multi            | 32,849 | 3,579   | 1,841  |
| 6    | Compute  | 4 CPUs   | Multi (blocking) | 1,278  | 1,092   | 83     |
| 7    | Compute  | 4 CPUs   | Multi (proper)   | 1,762  | 1,092   | 83     |

## Final Rankings

### Static Response (best per server)

| Rank | Server  | Best req/s | Avg Latency | Configuration        |
| ---- | ------- | ---------- | ----------- | -------------------- |
| 🥇   | Rust    | 35,924     | 2.8ms       | 1 CPU, single binary |
| 🥈   | Node.js | 3,579      | 27.0ms      | 4 CPUs, cluster mode |
| 🥉   | Python  | 1,922      | 51.9ms      | 1 CPU, single worker |

### CPU-Bound Compute

| Rank | Server  | Req/s | Avg Latency | Parallelism              |
| ---- | ------- | ----- | ----------- | ------------------------ |
| 🥇   | Rust    | 1,762 | 55ms        | web::block() thread pool |
| 🥈   | Node.js | 1,092 | 81ms        | Cluster mode             |
| 🥉   | Python  | 83    | 962ms       | 4 uvicorn workers        |

### Memory Efficiency (after hours of runtime)

| Rank | Server  | Memory  |
| ---- | ------- | ------- |
| 🥇   | Rust    | 5.5 MiB |
| 🥈   | Node.js | 144 MiB |
| 🥉   | Python  | 165 MiB |


## Key Learnings

| Insight                                      | Evidence                                                       |
| -------------------------------------------- | -------------------------------------------------------------- |
| CPU limits have outsized impact              | 250m → 1 CPU = 3-4x throughput gain across all servers         |
| Multi-worker hurts on single CPU             | Node.js -9%, Python -5% due to context switching overhead      |
| Multi-worker needs multi-CPU + heavy work    | 4 workers on 4 CPUs with static response = negligible gain     |
| Async ≠ parallel for CPU work                | Rust without `web::block()` ≈ Node.js performance              |
| V8 JIT rivals compiled code for math         | Node.js reaches 62% of Rust's speed on prime computation       |
| Python's GIL is the real bottleneck          | 4 workers on 4 CPUs = 0% improvement for static                |
| Framework overhead dominates light workloads | Rust 10x faster on static, but only 1.6x on compute vs Node.js |
| Rust has no memory bloat over time           | 5.5 MiB after hours vs Node.js 144 MiB, Python 165 MiB         |
| More CPU doesn't always help                 | Rust: 35,924 → 32,849 req/s going 1→4 CPUs (static)            |

---

# Part 3: Setup Guide

## Prerequisites

- Docker Desktop with Kubernetes enabled
- `kubectl` configured
- Local Docker registry running

## 1. Start Local Registry

```bash
docker run -d -p 5000:5000 --name registry registry:2
```

## 2. Build & Push Images

```bash
# Rust
cd stack/rust
docker build -t localhost:5000/rust:v5 .
docker push localhost:5000/rust:v5

# Node.js
cd stack/nodejs
docker build -t localhost:5000/nodejs:v3 .
docker push localhost:5000/nodejs:v3

# Python
cd stack/python
docker build -t localhost:5000/python:v3 .
docker push localhost:5000/python:v3
```

## 3. Deploy to Kubernetes

```bash
kubectl apply -f stack/rust-deployment.yaml
kubectl apply -f stack/python-deployment.yaml
kubectl apply -f stack/nodejs-deployment.yaml
kubectl apply -f stack/nginx-deployment.yaml
```

## 4. Verify Pods

```bash
kubectl get po
```

## 5. Access Services

Via Nginx reverse proxy:

```bash
kubectl port-forward svc/nginx-service 9090:80
```

- Rust: http://localhost:9090/rust/
- Python: http://localhost:9090/python/
- Node.js: http://localhost:9090/nodejs/

## 6. Run Stress Tests

```bash
# Static endpoint
kubectl run stress-rust --rm -it --image=williamyeh/hey -- -n 50000 -c 100 http://rust-service:8081/
kubectl run stress-nodejs --rm -it --image=williamyeh/hey -- -n 50000 -c 100 http://nodejs-service:3000/
kubectl run stress-python --rm -it --image=williamyeh/hey -- -n 50000 -c 100 http://python-service:8000/

# Compute endpoint
kubectl run stress-rust --rm -it --image=williamyeh/hey -- -n 5000 -c 100 http://rust-service:8081/compute
kubectl run stress-nodejs --rm -it --image=williamyeh/hey -- -n 5000 -c 100 http://nodejs-service:3000/compute
kubectl run stress-python --rm -it --image=williamyeh/hey -- -n 5000 -c 100 http://python-service:8000/compute
```

## 7. Monitor Resources

```bash
kubectl top pods
```

Or use Grafana:

```bash
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

Open http://localhost:3000

## 8. Check Registry

```bash
curl http://localhost:5000/v2/_catalog
```
