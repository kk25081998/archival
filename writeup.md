# Web Archival Tool - Technical Writeup

## Problem Statement & Solution

The original web archival system faced critical limitations: HTTP request timeouts for large websites, a hard limit of 20 pages per archive, and blocking UI during long-running operations. I redesigned the system with an **async job queue architecture** that eliminates these constraints while providing real-time progress tracking.

## Key Architectural Decisions

### 1. **Async Job Queue with Background Processing**

**Decision**: Implemented an in-memory job queue where archive requests return immediately with a job ID, while the actual crawling happens in background processes.

**Trade-offs**:

- ✅ **Pros**: Eliminates timeout issues, improves user experience, enables unlimited page archiving
- ❌ **Cons**: Added complexity, jobs lost on server restart, requires polling for status updates

**Alternative considered**: Synchronous processing with longer timeouts - rejected due to poor scalability and user experience.

### 2. **Real-time Progress Tracking**

**Decision**: Track detailed progress metrics (pages processed, assets downloaded, current page) and expose via REST API.

**Trade-offs**:

- ✅ **Pros**: Transparent user experience, ability to monitor large jobs, debugging capabilities
- ❌ **Cons**: Increased memory usage, polling overhead for frontend

**Alternative considered**: Fire-and-forget jobs - rejected due to poor user experience for long-running operations.

### 3. **In-Memory Storage for Job State**

**Decision**: Use JavaScript Maps for active jobs and job history rather than database persistence.

**Trade-offs**:

- ✅ **Pros**: Zero external dependencies, fast read/write operations, simple implementation
- ❌ **Cons**: Jobs lost on restart, not suitable for distributed systems, limited scalability

**Alternative considered**: Redis or database storage - deferred due to complexity and deployment simplicity requirements.

### 4. **Configurable Page Limits**

**Decision**: Allow users to specify archive depth (1-1000 pages) instead of hardcoded 20-page limit.

**Trade-offs**:

- ✅ **Pros**: Flexible for different use cases, user control over resource usage
- ❌ **Cons**: Risk of resource exhaustion, potential for abuse

**Alternative considered**: Fixed higher limit - rejected due to lack of flexibility.

## What I Would Do Differently With More Time

### 1. **Persistent Job Queue**

Implement Redis or database-backed job storage for persistence across server restarts. This would enable:

- Job recovery after system failures
- Distributed processing across multiple servers
- Better job history and analytics

### 2. **WebSocket Real-time Updates**

Replace polling with WebSocket connections for live progress updates, reducing:

- Network overhead from constant polling
- Latency in progress updates
- Server load from frequent API calls

### 3. **Enhanced Error Handling & Retry Logic**

Implement exponential backoff for failed asset downloads and page crawling:

- Automatic retry for transient failures
- Circuit breaker pattern for consistently failing resources
- Detailed error categorization and reporting

### 4. **Resource Management & Rate Limiting**

Add proper resource controls:

- Memory usage monitoring and limits
- Concurrent job limits per user/IP
- Request rate limiting to prevent server overload
- Disk space monitoring and cleanup policies

### 5. **Comprehensive Testing**

Develop automated test suite covering:

- Job lifecycle management
- Error scenarios and recovery
- Performance under load
- Frontend-backend integration

## Production Scaling Strategy

### **Phase 1: Foundation (Immediate)**

- **Database Integration**: Replace in-memory storage with PostgreSQL for job persistence
- **Message Queue**: Implement Redis-based job queue for reliability
- **Monitoring**: Add application metrics, logging, and health checks
- **Security**: API authentication, rate limiting, input validation

### **Phase 2: Reliability (3-6 months)**

- **Horizontal Scaling**: Container orchestration with Kubernetes
- **Load Balancing**: Multiple backend instances behind load balancer
- **Data Persistence**: Separate storage service (S3/MinIO) for archived content
- **Backup Strategy**: Automated backups of job data and archived content

### **Phase 3: Enterprise Features (6-12 months)**

- **Multi-tenancy**: User accounts, team collaboration, access controls
- **Advanced Features**: Scheduled archiving, content search, diff comparison
- **API Gateway**: Centralized API management, analytics, quotas
- **Global Distribution**: CDN for archived content, regional deployments

### **Technical Architecture for Scale**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway   │    │   Web Frontend  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
    ┌─────────────────────────────────────────────────────────────┐
    │                    Application Layer                        │
    ├─────────────────┬─────────────────┬─────────────────────────┤
    │   Archive API   │   Job Manager   │   Progress Tracker      │
    │   (Express.js)  │   (Bull Queue)  │   (WebSocket/SSE)       │
    └─────────────────┴─────────────────┴─────────────────────────┘
                                 │
    ┌─────────────────────────────────────────────────────────────┐
    │                     Data Layer                              │
    ├─────────────────┬─────────────────┬─────────────────────────┤
    │   PostgreSQL    │   Redis Cache   │   Object Storage        │
    │   (Job Data)    │   (Job Queue)   │   (Archived Content)    │
    └─────────────────┴─────────────────┴─────────────────────────┘
```

### **Key Scaling Metrics**

- **Concurrent Jobs**: Target 100+ simultaneous archives
- **Throughput**: 1000+ pages/minute across all jobs
- **Storage**: Multi-TB capacity with automated archiving
- **Availability**: 99.9% uptime with graceful degradation

## Conclusion

The async job architecture successfully addresses the core limitations while maintaining simplicity. The current implementation provides a solid foundation that can evolve from a development prototype to an enterprise-grade solution through iterative improvements in persistence, reliability, and scalability.
