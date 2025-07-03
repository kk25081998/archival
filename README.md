# Web Archival Tool

A web archiving tool similar to the Wayback Machine that allows you to capture and preserve web pages with all their assets (HTML, CSS, JavaScript, images) for later viewing.

## Features

- **Web Page Archiving**: Capture complete web pages with all assets
- **Asset Preservation**: Download and store images, stylesheets, and scripts locally
- **Version Management**: Maintain multiple snapshots of the same website
- **Snapshot Viewer**: View archived pages in an iframe with full functionality
- **Re-archiving**: Create new snapshots of previously archived sites
- **Modern UI**: Clean, responsive React interface

## Tech Stack

- **Frontend**: React 18, Vite, React Router
- **Backend**: Node.js, Express
- **Dependencies**: Axios, Cheerio, fs-extra, url-parse
- **Storage**: File-based storage (no database required)

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
   - Click "Archive Website"
   - Wait for the archiving process to complete
   - You'll be automatically redirected to the snapshot viewer

3. **View snapshots**:

   - Browse through different archived versions in the sidebar
   - Click on any timestamp to view that specific snapshot
   - Use the "Re-archive Current Site" button to create a new snapshot

4. **Navigate between views**:
   - Use the "Back to Archive Form" button to return to the main page
   - The URL structure is `/view/{hostname}/{timestamp}` for direct access

## API Endpoints

### POST `/api/archive`

Archives a website and its assets.

**Request:**

```json
{
  "url": "https://example.com"
}
```

**Response:**

```json
{
  "success": true,
  "host": "example.com",
  "timestamp": "2024-01-15T10-30-00-000Z",
  "assetCount": 15
}
```

### GET `/api/archives/:host`

Retrieves all archived versions for a specific host.

**Response:**

```json
[
  {
    "timestamp": "2024-01-15T10-30-00-000Z",
    "url": "https://example.com",
    "assetCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### GET `/archive/:host/:timestamp/*`

Serves archived snapshots as static files.

## Data Structure

Archived data is stored in the following structure:

```
backend/data/
├── example.com/
│   ├── metadata.json
│   ├── 2024-01-15T10-30-00-000Z/
│   │   ├── index.html
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
│   ├── server.js          # Express server
│   ├── package.json
│   └── data/              # Archived files
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ArchiveForm.jsx
│   │   │   └── SnapshotViewer.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── package.json           # Root package.json
└── README.md
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm start` - Start the backend server
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend

## Limitations & Trade-offs

### Current Limitations

- **No recursive crawling**: Only archives the main page, not linked pages
- **File-based storage**: Not suitable for large-scale production use
- **No authentication**: No user management or access controls
- **Limited asset types**: Focuses on images, CSS, and JavaScript files

### Design Decisions

- **File storage over database**: Simpler setup, no database configuration required
- **Single-page archiving**: Faster processing, avoids infinite loops
- **Local asset rewriting**: Ensures archived pages work offline
- **Timestamp-based versioning**: Simple and effective for version management

## Future Enhancements

If you have more time, consider implementing:

1. **Recursive crawling**: Follow and archive linked pages on the same domain
2. **Database storage**: Use PostgreSQL or MongoDB for better scalability
3. **User authentication**: Add user accounts and access controls
4. **Scheduled archiving**: Automatic periodic archiving with cron jobs
5. **Diff tool**: Compare changes between different snapshots
6. **Search functionality**: Search through archived content
7. **API rate limiting**: Prevent abuse and ensure fair usage
8. **Compression**: Compress archived files to save storage space

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 3001 are in use, modify the port in the respective config files
2. **CORS errors**: The backend includes CORS middleware, but ensure the frontend is making requests to the correct backend URL
3. **Asset download failures**: Some websites may block automated requests or have broken asset links
4. **Large file downloads**: Very large assets may timeout; consider increasing timeout values in the backend

### Debug Mode

To enable more verbose logging, add `DEBUG=*` to your environment variables:

```bash
DEBUG=* npm run dev
```

## License

This project is open source and available under the MIT License.
