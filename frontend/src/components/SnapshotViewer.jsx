import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function SnapshotViewer() {
  const { host, timestamp } = useParams()
  const navigate = useNavigate()
  const [archives, setArchives] = useState([])
  const [sitemap, setSitemap] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reArchiving, setReArchiving] = useState(false)
  const [error, setError] = useState('')
  const [loadingSitemap, setLoadingSitemap] = useState(false)

  useEffect(() => {
    fetchArchives()
    fetchSitemap()
  }, [host, timestamp])

  const fetchArchives = async () => {
    try {
      const response = await axios.get(`/api/archives/${host}`)
      setArchives(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (err) {
      setError('Failed to load archives')
    } finally {
      setLoading(false)
    }
  }

  const fetchSitemap = async () => {
    if (!host || !timestamp) return
    
    setLoadingSitemap(true)
    try {
      const response = await axios.get(`/api/sitemap/${host}/${timestamp}`)
      setSitemap(response.data)
    } catch (err) {
      console.error('Failed to load sitemap:', err)
    } finally {
      setLoadingSitemap(false)
    }
  }

  const selectPage = (page) => {
    setSelectedPage(page)
  }

  const handleReArchive = async () => {
    setReArchiving(true)
    setError('')

    try {
      const response = await axios.post('/api/archive', { 
        url: archives.find(a => a.timestamp === timestamp)?.url || `https://${host}` 
      })
      
      if (response.data.success) {
        // Refresh archives and navigate to new snapshot
        await fetchArchives()
        navigate(`/view/${host}/${response.data.timestamp}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to re-archive')
    } finally {
      setReArchiving(false)
    }
  }

  const formatTimestamp = (ts) => {
    // Backend format: "2024-01-15T10-30-00-000Z"
    // Convert back to ISO format: "2024-01-15T10:30:00.000Z"
    const isoString = ts
      .replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, 
               '$1-$2-$3T$4:$5:$6.$7Z')
    
    const date = new Date(isoString)
    
    if (isNaN(date.getTime())) {
      console.error('Invalid timestamp format:', ts)
      return 'Invalid Date'
    }
    
    // Format with both date and time
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const getSnapshotUrl = (host, timestamp, page = null) => {
    const baseUrl = `/archive/${host}/${timestamp}/`
    if (!page || page.path === 'index.html') {
      return baseUrl
    }
    return `${baseUrl}${page.path}`
  }

  const getCurrentPageUrl = () => {
    return getSnapshotUrl(host, timestamp, selectedPage)
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>Loading archives...</span>
      </div>
    )
  }

  return (
    <div>
      <button 
        onClick={() => navigate('/')} 
        className="btn-primary nav-button"
      >
        ← Back to Archive Form
      </button>
      
      <h2>Snapshot Viewer: {host}</h2>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
        
      )}

      <div className="snapshot-viewer">
        {/* Archives Sidebar */}
        <div className="sidebar">
          <h3>Archived Versions</h3>
          {archives.length === 0 ? (
            <div className="empty-state">
              <p>No archives found for this domain.</p>
            </div>
          ) : (
            archives.map((archive) => (
              <div
                key={archive.timestamp}
                className={`archive-item ${archive.timestamp === timestamp ? 'active' : ''}`}
                onClick={() => navigate(`/view/${host}/${archive.timestamp}`)}
              >
                <div className="timestamp">
                  {formatTimestamp(archive.timestamp)}
                </div>
                <div className="details">
                  {archive.assetCount} assets • {archive.pageCount || 1} pages • {new Date(archive.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
          
          <button
            onClick={handleReArchive}
            className="btn-primary re-archive-btn"
            disabled={reArchiving}
          >
            {reArchiving ? (
              <>
                <div className="spinner"></div>
                Re-archiving...
              </>
            ) : (
              'Re-archive Current Site'
            )}
          </button>
        </div>

        {/* Sitemap Panel */}
        <div className="sitemap-panel">
          <div className="sitemap-header">
            <h3>Site Map</h3>
          </div>
          <div className="sitemap-content">
            {loadingSitemap ? (
              <div className="loading">
                <div className="spinner"></div>
                <span>Loading sitemap...</span>
              </div>
            ) : sitemap.length === 0 ? (
              <div className="empty-state">
                <p>No pages found in this archive.</p>
              </div>
            ) : (
              <>
                {sitemap.map((page, index) => (
                  <div
                    key={index}
                    className={`sitemap-link ${selectedPage?.path === page.path ? 'active' : ''}`}
                    onClick={() => selectPage(page)}
                  >
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {page.displayPath}
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: '0.7' }}>
                      {formatFileSize(page.size)}
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--gray-50)', borderRadius: 'var(--radius-lg)', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
                  💡 Click any page above to view it in the main panel →
                </div>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="iframe-container">
          {archives.find(a => a.timestamp === timestamp) ? (
            <iframe
              key={selectedPage?.path || 'index'}
              src={getCurrentPageUrl()}
              title={`Snapshot of ${host} at ${formatTimestamp(timestamp)} - ${selectedPage?.displayPath || '/'}`}
            />
          ) : (
            <div className="empty-state">
              <p>Snapshot not found. Please select a valid archive from the sidebar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SnapshotViewer 