# Web Archival Tool

A web archiving tool that allows you to capture and preserve web pages with all their assets (HTML, CSS, JavaScript, images) for later viewing.

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

## Usage

1. **Open the application** in your browser at `http://localhost` (docker) or `http://localhost:3000` (quick start or manual)

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

### Expected Log Messages

The following log messages are normal and don't indicate problems:

- `Failed to download asset data:...`: Data URLs (base64 embedded content) can't be downloaded
- `Skipping potentially problematic asset`: Assets that commonly cause issues are intentionally skipped
