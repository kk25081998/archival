# Docker Setup for Web Archival Tool

This guide explains how to run the Web Archival Tool using Docker containers.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed on your system
- At least 2GB of available RAM
- Available ports: 80 (frontend) and 3001 (backend)

### Running the Application

1. **Clone and navigate to the project:**

   ```bash
   git clone <repository-url>
   cd archival
   ```

2. **Start the application:**

   ```bash
   docker-compose up -d
   ```

3. **Access the application:**

   - Open your browser and go to: http://localhost
   - The application will be ready when both containers are healthy

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

## 📁 Architecture

The application consists of two Docker services:

### Backend Service

- **Image**: Node.js 18 Alpine
- **Port**: 3001
- **Purpose**: API server for archiving websites
- **Data**: Persisted in Docker volume `archival-data`

### Frontend Service

- **Image**: Nginx Alpine
- **Port**: 80
- **Purpose**: Serves React app and proxies API calls
- **Build**: Multi-stage build (Node.js → Nginx)

## 🔧 Configuration

### Environment Variables

You can customize the backend by setting environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3001
  - MAX_PAGES=20 # Maximum pages to crawl per site
```

### Port Configuration

To change the default ports, modify `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "8080:80" # Change frontend port to 8080
  backend:
    ports:
      - "3002:3001" # Change backend port to 3002
```

## 💾 Data Persistence

Archived data is stored in a Docker volume named `archival-data`. This ensures your archives persist between container restarts.

### Managing Data

**View volume details:**

```bash
docker volume inspect archival-data
```

**Backup data:**

```bash
docker run --rm -v archival-data:/data -v $(pwd):/backup alpine tar czf /backup/archival-backup.tar.gz -C /data .
```

**Restore data:**

```bash
docker run --rm -v archival-data:/data -v $(pwd):/backup alpine tar xzf /backup/archival-backup.tar.gz -C /data
```

**Remove all data:**

```bash
docker-compose down
docker volume rm archival-data
```

## 🐛 Troubleshooting

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Common Issues

**Port already in use:**

```bash
# Check what's using port 80
sudo lsof -i :80
# Kill the process or change the port in docker-compose.yml
```

**Container won't start:**

```bash
# Rebuild images
docker-compose build --no-cache
docker-compose up -d
```

**Out of disk space:**

```bash
# Clean up Docker
docker system prune -a
docker volume prune
```

## 🔄 Development Setup

For development with live reloading:

1. **Create `docker-compose.dev.yml`:**

   ```yaml
   version: "3.8"
   services:
     backend:
       build: ./backend
       volumes:
         - ./backend:/app
         - archival-data:/app/data
       environment:
         - NODE_ENV=development
       command: npm run dev

     frontend:
       build: ./frontend
       volumes:
         - ./frontend:/app
       environment:
         - CHOKIDAR_USEPOLLING=true
       command: npm run dev
   ```

2. **Run development environment:**
   ```bash
   docker-compose -f docker-compose.dev.yml up
   ```

## 📊 Monitoring

### Health Checks

Both services include health checks:

- **Backend**: HTTP check on `/api/archives/health`
- **Frontend**: Nginx status check

Check service health:

```bash
docker-compose ps
```

### Resource Usage

```bash
docker stats archival-frontend archival-backend
```

## 🚀 Production Deployment

For production deployment:

1. **Use environment-specific compose file:**

   ```yaml
   # docker-compose.prod.yml
   version: "3.8"
   services:
     backend:
       build: ./backend
       restart: always
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"

     frontend:
       build: ./frontend
       restart: always
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

2. **Deploy:**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## 🔒 Security Notes

- Backend runs as non-root user (`node`)
- Only necessary ports are exposed
- Static assets are served with proper caching headers
- API requests have timeout protections

## 🛠️ Building Individual Images

**Backend only:**

```bash
cd backend
docker build -t archival-backend .
docker run -p 3001:3001 -v archival-data:/app/data archival-backend
```

**Frontend only:**

```bash
cd frontend
docker build -t archival-frontend .
docker run -p 80:80 archival-frontend
```
