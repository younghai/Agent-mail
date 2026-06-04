# v1 Kubernetes Deployment Guide

## 1. 클러스터 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                      Kubernetes Cluster                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Ingress Controller                   │  │
│  │              (NGINX / Traefik / Kong)                 │  │
│  │                  TLS 1.3 Termination                   │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────┼───────────────────────────────┐  │
│  │                       │                               │  │
│  │  ┌──────────────┐  ┌──┴───────────┐  ┌─────────────┐  │  │
│  │  │   frontend   │  │  api-gateway  │  │  haraka     │  │  │
│  │  │   (3 pods)   │  │   (2 pods)    │  │  (2 pods)   │  │  │
│  │  │  React SPA   │  │   Kong/Nginx  │  │  SMTP 25    │  │  │
│  │  └──────────────┘  └───────────────┘  └─────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │  │
│  │  │ mail-server  │  │   ai-agent    │  │ user-service│  │  │
│  │  │   (3 pods)   │  │   (2 pods)    │  │  (2 pods)   │  │  │
│  │  │  Node.js     │  │   Python      │  │   Node.js   │  │  │
│  │  └──────────────┘  └───────────────┘  └─────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐  │  │
│  │  │  postgres    │  │    redis      │  │   minio     │  │  │
│  │  │  StatefulSet │  │  StatefulSet  │  │ StatefulSet │  │  │
│  │  │  Primary+Rep │  │   Sentinel    │  │  4 replicas │  │  │
│  │  └──────────────┘  └───────────────┘  └─────────────┘  │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐   │  │
│  │  │              Monitoring Stack                    │   │  │
│  │  │  Prometheus + Grafana + Jaeger + Loki           │   │  │
│  │  └─────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 2. Namespace 구성

```yaml
# k8s/base/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: agentic-inbox
  labels:
    istio-injection: enabled  # (선택) Service Mesh
```

## 3. 핵심 리소스

### 3.1 Mail Server Deployment

```yaml
# k8s/base/mail-server/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mail-server
  namespace: agentic-inbox
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: mail-server
  template:
    metadata:
      labels:
        app: mail-server
    spec:
      containers:
        - name: mail-server
          image: agentic-inbox/mail-server:latest
          ports:
            - containerPort: 8080
              name: http
          env:
            - name: NODE_ENV
              value: "production"
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: redis-credentials
                  key: url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
```

```yaml
# k8s/base/mail-server/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: mail-server
  namespace: agentic-inbox
spec:
  selector:
    app: mail-server
  ports:
    - port: 8080
      targetPort: 8080
      name: http
  type: ClusterIP
```

```yaml
# k8s/base/mail-server/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: mail-server-hpa
  namespace: agentic-inbox
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: mail-server
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 3.2 AI Agent Deployment

```yaml
# k8s/base/ai-agent/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-agent
  namespace: agentic-inbox
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ai-agent
  template:
    metadata:
      labels:
        app: ai-agent
    spec:
      containers:
        - name: ai-agent
          image: agentic-inbox/ai-agent:latest
          ports:
            - containerPort: 8000
              name: http
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: ai-credentials
                  key: openai-key
            - name: MAIL_SERVER_URL
              value: "http://mail-server:8080"
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
```

### 3.3 PostgreSQL StatefulSet

```yaml
# k8s/base/postgres/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: agentic-inbox
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
            - name: POSTGRES_DB
              value: "agentic_inbox"
          volumeMounts:
            - name: postgres-storage
              mountPath: /var/lib/postgresql/data
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "2Gi"
              cpu: "1000m"
  volumeClaimTemplates:
    - metadata:
        name: postgres-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 50Gi
```

### 3.4 Redis StatefulSet (Sentinel)

```yaml
# k8s/base/redis/statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: agentic-inbox
spec:
  serviceName: redis
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
        - name: redis
          image: redis:7-alpine
          ports:
            - containerPort: 6379
          command:
            - redis-server
            - --appendonly
            - "yes"
            - --maxmemory
            - "512mb"
            - --maxmemory-policy
            - allkeys-lru
          volumeMounts:
            - name: redis-storage
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: redis-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

## 4. Ingress

```yaml
# k8s/base/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agentic-inbox-ingress
  namespace: agentic-inbox
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
    - hosts:
        - api.agentic-inbox.example.com
        - app.agentic-inbox.example.com
      secretName: agentic-inbox-tls
  rules:
    - host: api.agentic-inbox.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-gateway
                port:
                  number: 80
    - host: app.agentic-inbox.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

## 5. Secrets 관리

### 5.1 Sealed Secrets (Bitnami)

```bash
# 로컬에서 Secret 생성 및 암호화
kubectl create secret generic db-credentials \
  --from-literal=url='postgresql://...' \
  --dry-run=client -o yaml | \
  kubeseal --controller-namespace=kube-system --controller-name=sealed-secrets \
  --format yaml > k8s/secrets/db-credentials.yaml

# 클러스터에 적용
kubectl apply -f k8s/secrets/db-credentials.yaml
```

### 5.2 External Secrets Operator (AWS/GCP)

```yaml
# k8s/secrets/external-secret.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
  namespace: agentic-inbox
spec:
  refreshInterval: 1h
  secretStoreRef:
    kind: ClusterSecretStore
    name: aws-secrets-manager
  target:
    name: db-credentials
  data:
    - secretKey: url
      remoteRef:
        key: agentic-inbox/production/db
        property: url
```

## 6. 배포 파이프라인

```yaml
# .github/workflows/deploy.yml
name: Deploy to Kubernetes
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build images
        run: |
          docker build -t $REGISTRY/mail-server:${{ github.sha }} ./services/mail-server
          docker build -t $REGISTRY/ai-agent:${{ github.sha }} ./services/ai-agent
          docker build -t $REGISTRY/frontend:${{ github.sha }} ./services/frontend

      - name: Push images
        run: |
          docker push $REGISTRY/mail-server:${{ github.sha }}
          docker push $REGISTRY/ai-agent:${{ github.sha }}
          docker push $REGISTRY/frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup kubectl
        uses: azure/setup-kubectl@v3

      - name: Update image tags
        run: |
          kustomize edit set image \
            mail-server=$REGISTRY/mail-server:${{ github.sha }} \
            ai-agent=$REGISTRY/ai-agent:${{ github.sha }} \
            frontend=$REGISTRY/frontend:${{ github.sha }}
        working-directory: k8s/overlays/production

      - name: Deploy
        run: |
          kustomize build k8s/overlays/production | kubectl apply -f -
          kubectl rollout status deployment/mail-server -n agentic-inbox --timeout=300s
          kubectl rollout status deployment/ai-agent -n agentic-inbox --timeout=300s
```

## 7. Kustomize 구조

```
k8s/
├── base/
│   ├── namespace.yaml
│   ├── kustomization.yaml
│   ├── mail-server/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── hpa.yaml
│   ├── ai-agent/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── frontend/
│   │   ├── deployment.yaml
│   │   └── service.yaml
│   ├── postgres/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   ├── redis/
│   │   ├── statefulset.yaml
│   │   └── service.yaml
│   └── ingress.yaml
├── overlays/
│   ├── development/
│   │   ├── kustomization.yaml
│   │   └── patches/
│   │       ├── replica-count.yaml
│   │       └── resource-limits.yaml
│   ├── staging/
│   │   └── ...
│   └── production/
│       ├── kustomization.yaml
│       ├── patches/
│       │   ├── replica-count.yaml
│       │   ├── resource-limits.yaml
│       │   └── node-affinity.yaml
│       └── secrets/
└── secrets/
```

## 8. 운영 체크리스트

- [ ] Prometheus + Grafana 모니터링 구축
- [ ] Loki 중앙 로깅 구축
- [ ] Jaeger 분산 추적 구축
- [ ] PodDisruptionBudget 설정
- [ ] NetworkPolicy 설정 (서비스 간 통신 제한)
- [ ] Pod Security Standards 적용
- [ ] Vault/Sealed Secrets 적용
- [ ] Velero 백업 설정
- [ ] cert-manager TLS 자동 갱신
- [ ] Cluster Autoscaler 설정
