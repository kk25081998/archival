import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ArchiveForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [archivedWebsites, setArchivedWebsites] = useState([])
  const [loadingWebsites, setLoadingWebsites] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchArchivedWebsites()
  }, [])

  const fetchArchivedWebsites = async () => {
    try {
      const response = await axios.get('/api/archives')
      setArchivedWebsites(response.data)
    } catch (err) {
      console.error('Failed to fetch archived websites:', err)
    } finally {
      setLoadingWebsites(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/api/archive', { url: url.trim() })
      
      if (response.data.success) {
        setSuccess(`Successfully archived! ${response.data.assetCount} assets downloaded.`)
        setUrl('')
        
        // Refresh the archived websites list
        fetchArchivedWebsites()
        
        // Navigate to the snapshot viewer after a short delay
        setTimeout(() => {
          navigate(`/view/${response.data.host}/${response.data.timestamp}`)
        }, 2000)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to archive URL. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleWebsiteClick = (website) => {
    navigate(`/view/${website.host}/${website.latestArchive.timestamp}`)
  }

  return (
    <div className="archive-form">
      <h2>Archive a Website</h2>
      <p>Enter a URL to create a snapshot of the website with all its assets.</p>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="url">Website URL</label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Archiving...
            </>
          ) : (
            'Archive Website'
          )}
        </button>
      </form>

      {/* Previously Archived Websites */}
      <div style={{ marginTop: 'var(--space-8)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--gray-200)' }}>
        <h3 style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          📂 Previously Archived Websites
        </h3>
        
        {loadingWebsites ? (
          <div className="loading" style={{ padding: 'var(--space-4)' }}>
            <div className="spinner"></div>
            <span>Loading archived websites...</span>
          </div>
        ) : archivedWebsites.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            <p style={{ margin: 0, opacity: 0.7 }}>No websites archived yet. Archive your first website above!</p>
          </div>
        ) : (
          <div className="archived-websites-grid">
            {archivedWebsites.map((website, index) => (
              <div
                key={index}
                className="archived-website-card"
                onClick={() => handleWebsiteClick(website)}
              >
                <div className="website-info">
                  <div className="website-host">
                    {website.host}
                  </div>
                  <div className="website-details">
                    <span className="archive-count">
                      {website.totalArchives} archive{website.totalArchives !== 1 ? 's' : ''}
                    </span>
                    <span className="last-archived">
                      Last: {formatTimestamp(website.lastArchived)}
                    </span>
                  </div>
                  <div className="website-stats">
                    {website.latestArchive.assetCount} assets • {website.latestArchive.pageCount || 1} pages
                  </div>
                </div>
                <div className="website-action">
                  →
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ArchiveForm 