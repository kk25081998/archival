import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function SnapshotViewer() {
  const { host, timestamp } = useParams()
  const navigate = useNavigate()
  const [archives, setArchives] = useState([])
  const [loading, setLoading] = useState(true)
  const [reArchiving, setReArchiving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchArchives()
  }, [host])

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
    return new Date(ts.replace(/-/g, ':')).toLocaleString()
  }

  const getSnapshotUrl = (host, timestamp) => {
    return `/archive/${host}/${timestamp}/`
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
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/')} 
          className="btn-primary"
          style={{ marginRight: '10px' }}
        >
          ← Back to Archive Form
        </button>
        <h2>Snapshot Viewer: {host}</h2>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="snapshot-viewer">
        <div className="sidebar">
          <h3>Archived Versions</h3>
          {archives.length === 0 ? (
            <p>No archives found for this domain.</p>
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
                  {archive.assetCount} assets • {new Date(archive.createdAt).toLocaleDateString()}
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
              <span>
                <div className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '8px' }}></div>
                Re-archiving...
              </span>
            ) : (
              'Re-archive Current Site'
            )}
          </button>
        </div>

        <div className="iframe-container">
          {archives.find(a => a.timestamp === timestamp) ? (
            <iframe
              src={getSnapshotUrl(host, timestamp)}
              title={`Snapshot of ${host} at ${formatTimestamp(timestamp)}`}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <p>Snapshot not found. Please select a valid archive from the sidebar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SnapshotViewer 