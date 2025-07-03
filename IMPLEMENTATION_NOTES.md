# Implementation Notes

## Overview

This web archiving tool was built following a 6-hour sprint plan to create a functional end-to-end demo. The implementation focuses on core functionality while making pragmatic trade-offs to ensure delivery within the time constraint.

## Key Design Decisions

### 1. Monorepo Structure

- **Choice**: Single repository with frontend and backend as separate packages
- **Rationale**: Easier development workflow, shared tooling, and simplified deployment
- **Trade-off**: Slightly more complex initial setup but better long-term maintainability

### 2. File-Based Storage

- **Choice**: Local file system storage instead of a database
- **Rationale**:
  - No database setup required
  - Faster development and deployment
  - Simpler data structure for archived content
  - Direct file serving capabilities
- **Trade-off**: Not suitable for large-scale production or multi-user scenarios

### 3. Single-Page Archiving (No Recursive Crawling)

- **Choice**: Archive only the main page, not linked pages
- **Rationale**:
  - Fits within 6-hour timebox
  - Avoids infinite loops and complex crawling logic
  - Focuses on core functionality first
  - Easier to debug and maintain
- **Trade-off**: Limited scope compared to full recursive archiving

### 4. Asset Rewriting Strategy

- **Choice**: Download assets locally and rewrite HTML references
- **Rationale**:
  - Ensures archived pages work offline
  - Preserves visual appearance and functionality
  - Self-contained snapshots
- **Trade-off**: Larger storage requirements and longer archiving time

### 5. React + Vite Frontend

- **Choice**: Modern React with Vite for fast development
- **Rationale**:
  - Hot module replacement for rapid development
  - Built-in proxy configuration for API calls
  - Modern tooling and developer experience
- **Trade-off**: Learning curve for developers unfamiliar with Vite

## Technical Implementation Highlights

### Backend Architecture

- **Express.js server** with middleware for CORS and JSON parsing
- **Cheerio** for HTML parsing and manipulation
- **Axios** for HTTP requests with proper error handling
- **fs-extra** for enhanced file system operations
- **URL parsing** with proper relative URL resolution

### Frontend Architecture

- **React Router** for client-side routing
- **Component-based structure** with clear separation of concerns
- **State management** using React hooks
- **Responsive design** with modern CSS
- **Error handling** with user-friendly messages

### Data Flow

1. User submits URL → Frontend validates and sends to backend
2. Backend fetches HTML → Parses with Cheerio → Downloads assets
3. HTML is rewritten → Saved with assets → Metadata updated
4. Frontend receives response → Navigates to snapshot viewer
5. Snapshot viewer loads archived content in iframe

## Limitations and Future Improvements

### Current Limitations

1. **No recursive crawling**: Only archives the main page
2. **File-based storage**: Not scalable for production
3. **No authentication**: No user management
4. **Limited asset types**: Focuses on common web assets
5. **No compression**: Archived files can be large
6. **No rate limiting**: Potential for abuse

### Recommended Next Steps (if more time available)

1. **Recursive Crawling Implementation**

   - Add depth-limited crawling
   - Implement URL deduplication
   - Add robots.txt compliance
   - Handle relative vs absolute URLs

2. **Database Integration**

   - PostgreSQL for metadata storage
   - File system for actual assets
   - Proper indexing for fast queries
   - User management and access controls

3. **Enhanced Features**

   - Diff tool for comparing snapshots
   - Scheduled archiving with cron jobs
   - Search functionality across archives
   - API rate limiting and authentication
   - Compression for archived files

4. **Production Readiness**
   - Docker containerization
   - Environment configuration
   - Logging and monitoring
   - Error tracking and alerting
   - Backup and recovery procedures

## Performance Considerations

### Current Optimizations

- **Asset deduplication**: Prevents downloading the same asset multiple times
- **Timeout handling**: Prevents hanging requests
- **Error resilience**: Continues archiving even if some assets fail
- **Efficient file operations**: Uses fs-extra for better performance

### Potential Improvements

- **Streaming downloads**: For large files
- **Parallel asset downloading**: Using Promise.all with concurrency limits
- **Caching layer**: Redis for frequently accessed metadata
- **CDN integration**: For serving archived assets
- **Background processing**: Queue-based archiving for large sites

## Security Considerations

### Current Measures

- **Input validation**: URL validation and sanitization
- **CORS configuration**: Proper cross-origin handling
- **Error handling**: No sensitive information in error messages
- **File path validation**: Prevents directory traversal attacks

### Recommended Enhancements

- **Rate limiting**: Prevent abuse
- **Authentication**: User accounts and access controls
- **Input sanitization**: More robust URL and content validation
- **HTTPS enforcement**: Secure communication
- **Content security policies**: For iframe content

## Conclusion

This implementation successfully delivers a working web archiving tool within the 6-hour constraint. While it has limitations compared to production systems like the Wayback Machine, it demonstrates the core concepts and provides a solid foundation for future enhancements. The modular architecture and clear separation of concerns make it easy to extend and improve over time.

The tool meets all the basic requirements:

- ✅ URL input and archiving
- ✅ Asset preservation and local storage
- ✅ Version management with timestamps
- ✅ Snapshot viewing with iframe
- ✅ Re-archiving functionality
- ✅ Modern React UI

The implementation prioritizes functionality over features, ensuring a working demo that can be demonstrated and extended as needed.
