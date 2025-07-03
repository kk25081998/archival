# Web Archival Tool

A web archiving tool similar to the Wayback Machine that allows you to capture and preserve web pages with all their assets (HTML, CSS, JavaScript, images) for later viewing.

## 🚀 Features

- **Async Web Page Archiving**: Capture complete websites with background job processing
- **No Timeout Issues**: Archive jobs run independently without HTTP request timeouts
- **Configurable Page Limits**: Archive up to 1000 pages per website (default: 100)
- **Real-time Progress Tracking**: Live updates showing pages processed and assets downloaded
- **Asset Preservation**: Download and store images, stylesheets, and scripts locally
- **Version Management**: Maintain multiple snapshots of the same website
- **Snapshot Viewer**: View archived pages in an iframe with full functionality
- **Re-archiving**: Create new snapshots of previously archived sites
- **Job Queue System**: Track active and completed archive jobs
- **Modern UI**: Clean, responsive React interface with progress indicators

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Dependencies**: Axios, Cheerio, fs-extra, url-parse, uuid
- **Storage**: File-based storage (no database required)
- **Job Processing**: In-memory job queue with background processing

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd archival
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend (port 3001) and frontend (port 3000) servers concurrently.

### Manual Setup (Alternative)

If you prefer to run servers separately:

**Backend:**

```bash
cd backend
npm install
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

### Docker Setup (Recommended for Production)

For a production-ready setup using Docker:

1. **Build and start the containers**:

   ```bash
   docker-compose up --build -d
   ```

2. **Access the application**:

   - Frontend: `http://localhost` (port 80)
   - Backend API: `http://localhost:3001`

3. **Stop the containers**:
   ```bash
   docker-compose down
   ```

## 💡 For Future Updates

Whenever you make code changes, just run:

```bash
docker-compose down
docker-compose up --build -d
```

This will:

- Stop the existing containers
- Rebuild them with your latest code changes
- Start the updated containers in detached mode

Enjoy your beautifully redesigned web archival tool! 🌟

## Usage

1. **Open the application** in your browser at `http://localhost:3000`

2. **Archive a website**:

   - Enter a URL in the input field
   - Set the maximum number of pages to archive (1-1000, default: 100)
   - Click "Archive Website"
   - Monitor real-time progress with the progress bar and status updates
   - The archive job runs in the background without blocking the UI
   - You'll be automatically redirected to the snapshot viewer when complete

3. **Monitor archive progress**:

   - View live updates showing pages processed and assets downloaded
   - See the current page being crawled
   - Track progress with the visual progress bar
   - Jobs continue running even if you navigate away from the page

4. **View snapshots**:

   - Browse through different archived versions in the sidebar
   - Click on any timestamp to view that specific snapshot
   - Use the "Re-archive Current Site" button to create a new snapshot

5. **Navigate between views**:
   - Use the "Back to Archive Form" button to return to the main page
   - The URL structure is `/view/{hostname}/{timestamp}` for direct access

## API Endpoints

### POST `/api/archive`

Starts an async archive job for a website.

**Request:**

```json
{
  "url": "https://example.com",
  "maxPages": 100
}
```

**Response:**

```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Archive job started. Use /api/jobs/:jobId to check progress."
}
```

### GET `/api/jobs/:jobId`

Retrieves the status and progress of an archive job.

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "running",
  "progress": {
    "pagesProcessed": 15,
    "assetsDownloaded": 87,
    "currentPage": "https://example.com/about"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "startedAt": "2024-01-15T10:30:01.000Z",
  "completedAt": null,
  "result": null,
  "error": null
}
```

### GET `/api/jobs`

Retrieves all active archive jobs.

**Response:**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "url": "https://example.com",
    "hostname": "example.com",
    "status": "running",
    "progress": {
      "pagesProcessed": 15,
      "assetsDownloaded": 87,
      "currentPage": "https://example.com/about"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "startedAt": "2024-01-15T10:30:01.000Z"
  }
]
```

### GET `/api/archives/:host`

Retrieves all archived versions for a specific host.

**Response:**

```json
[
  {
    "timestamp": "2024-01-15T10-30-00-000Z",
    "url": "https://example.com",
    "assetCount": 87,
    "pageCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### GET `/api/archives`

Retrieves all archived websites with their latest archive info.

**Response:**

```json
[
  {
    "host": "example.com",
    "latestArchive": {
      "timestamp": "2024-01-15T10-30-00-000Z",
      "url": "https://example.com",
      "assetCount": 87,
      "pageCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "totalArchives": 3,
    "firstArchived": "2024-01-14T09:00:00.000Z",
    "lastArchived": "2024-01-15T10:30:00.000Z"
  }
]
```

### GET `/archive/:host/:timestamp/*`

Serves archived snapshots as static files.

## Job System

The archival system uses a background job queue to handle large websites without timeout issues:

### Job Statuses

- **pending**: Job created but not yet started
- **running**: Job is actively crawling and downloading assets
- **completed**: Job finished successfully
- **failed**: Job encountered an error and stopped

### Job Processing

1. When you submit a URL, a job is created immediately
2. The job runs in the background, crawling up to the specified page limit
3. Progress is tracked in real-time and can be monitored via the API
4. Completed jobs are moved to history for future reference
5. Failed jobs store error information for debugging

## Data Structure

Archived data is stored in the following structure:

```
backend/data/
├── example.com/
│   ├── metadata.json
│   ├── 2024-01-15T10-30-00-000Z/
│   │   ├── index.html
│   │   ├── about.html
│   │   ├── contact.html
│   │   └── assets/
│   │       ├── style.css
│   │       ├── script.js
│   │       └── image.jpg
│   └── 2024-01-15T11-00-00-000Z/
│       ├── index.html
│       └── assets/
└── another-site.com/
    └── ...
```

## Development

### Project Structure

```
archival/
├── backend/
│   ├── server.js          # Express server with job queue
│   ├── package.json
│   └── data/              # Archived files
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArchiveForm.jsx    # Updated with progress tracking
│   │   │   └── SnapshotViewer.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── package.json           # Root package.json
├── test-async-archive.js  # Test script for async functionality
└── README.md
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm start` - Start the backend server
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend

### Testing the Async System

Use the included test script to verify async functionality:

```bash
node test-async-archive.js
```

This will:

- Start a test archive job
- Monitor progress in real-time
- Display completion status
- Show job management capabilities

## Limitations & Trade-offs

### Current Limitations

- **File-based storage**: Not suitable for large-scale production use
- **In-memory job queue**: Jobs are lost on server restart
- **No authentication**: No user management or access controls
- **Limited asset types**: Focuses on images, CSS, and JavaScript files

### Design Decisions

- **File storage over database**: Simpler setup, no database configuration required
- **In-memory job queue**: Fast processing without external dependencies
- **Async processing**: Eliminates timeout issues for large websites
- **Local asset rewriting**: Ensures archived pages work offline
- **Timestamp-based versioning**: Simple and effective for version management

## Future Enhancements

If you have more time, consider implementing:

1. **Persistent job queue**: Use Redis or database for job persistence
2. **Database storage**: Use PostgreSQL or MongoDB for better scalability
3. **User authentication**: Add user accounts and access controls
4. **Scheduled archiving**: Automatic periodic archiving with cron jobs
5. **Diff tool**: Compare changes between different snapshots
6. **Search functionality**: Search through archived content
7. **API rate limiting**: Prevent abuse and ensure fair usage
8. **Compression**: Compress archived files to save storage space
9. **WebSocket notifications**: Real-time progress updates without polling
10. **Distributed processing**: Scale across multiple servers

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 3001 are in use, modify the port in the respective config files
2. **CORS errors**: The backend includes CORS middleware, but ensure the frontend is making requests to the correct backend URL
3. **Asset download failures**: Some websites may block automated requests or have broken asset links (these are logged but don't stop the job)
4. **Job not progressing**: Check the backend logs for detailed error messages
5. **Memory usage**: Large websites with many assets may consume significant memory

### Debug Mode

To enable more verbose logging, add `DEBUG=*` to your environment variables:

```bash
DEBUG=* npm run dev
```

### Job Management

- **View active jobs**: `GET /api/jobs`
- **Check job status**: `GET /api/jobs/:jobId`
- **Monitor backend logs**: Jobs log progress and errors with job IDs for easy tracking

### Expected Log Messages

The following log messages are normal and don't indicate problems:

- `Failed to download asset data:...`: Data URLs (base64 embedded content) can't be downloaded
- `Skipping potentially problematic asset`: Assets that commonly cause issues are intentionally skipped

## License

This project is open source and available under the MIT License.
