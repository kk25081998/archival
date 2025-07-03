import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ArchiveForm() {
  const [url, setUrl] = useState('')
  const [maxPages, setMaxPages] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [archivedWebsites, setArchivedWebsites] = useState([])
  const [loadingWebsites, setLoadingWebsites] = useState(true)
  const [currentJob, setCurrentJob] = useState(null)
  const [jobPollingInterval, setJobPollingInterval] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchArchivedWebsites()
  }, [])

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (jobPollingInterval) {
        clearInterval(jobPollingInterval)
      }
    }
  }, [jobPollingInterval])

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

  const pollJobStatus = async (jobId) => {
    try {
      const response = await axios.get(`/api/jobs/${jobId}`)
      const job = response.data
      
      setCurrentJob(job)
      
      if (job.status === 'completed') {
        setSuccess(`Successfully archived! ${job.result.assetCount} assets downloaded, ${job.result.pageCount} pages crawled.`)
        setLoading(false)
        setUrl('')
        setCurrentJob(null)
        
        // Clear polling
        if (jobPollingInterval) {
          clearInterval(jobPollingInterval)
          setJobPollingInterval(null)
        }
        
        // Refresh the archived websites list
        fetchArchivedWebsites()
        
        // Navigate to the snapshot viewer after a short delay
        setTimeout(() => {
          navigate(`/view/${job.result.host}/${job.result.timestamp}`)
        }, 2000)
        
      } else if (job.status === 'failed') {
        setError(`Archive job failed: ${job.error}`)
        setLoading(false)
        setCurrentJob(null)
        
        // Clear polling
        if (jobPollingInterval) {
          clearInterval(jobPollingInterval)
          setJobPollingInterval(null)
        }
      }
      
    } catch (err) {
      console.error('Failed to poll job status:', err)
      setError('Failed to get job status')
      setLoading(false)
      setCurrentJob(null)
      
      // Clear polling
      if (jobPollingInterval) {
        clearInterval(jobPollingInterval)
        setJobPollingInterval(null)
      }
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
    setCurrentJob(null)

    try {
      const response = await axios.post('/api/archive', { 
        url: url.trim(),
        maxPages: maxPages
      })
      
      if (response.data.success) {
        const jobId = response.data.jobId
        setCurrentJob({ 
          id: jobId, 
          status: 'pending', 
          progress: { pagesProcessed: 0, assetsDownloaded: 0, currentPage: null } 
        })
        
        // Start polling for job status
        const interval = setInterval(() => {
          pollJobStatus(jobId)
        }, 2000) // Poll every 2 seconds
        
        setJobPollingInterval(interval)
        
        // Initial poll
        pollJobStatus(jobId)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start archive job. Please try again.')
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

  const getJobStatusMessage = () => {
    if (!currentJob) return ''
    
    switch (currentJob.status) {
      case 'pending':
        return 'Starting archive job...'
      case 'running':
        return `Processing: ${currentJob.progress.pagesProcessed} pages, ${currentJob.progress.assetsDownloaded} assets downloaded`
      case 'completed':
        return 'Archive completed!'
      case 'failed':
        return 'Archive failed'
      default:
        return 'Unknown status'
    }
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
        
        <div className="form-group">
          <label htmlFor="maxPages">Maximum Pages to Archive</label>
          <input
            type="number"
            id="maxPages"
            value={maxPages}
            onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value) || 100))}
            min="1"
            max="1000"
            disabled={loading}
          />
          <small>Default: 100 pages (increased from previous limit of 20)</small>
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

      {/* Job Progress */}
      {currentJob && (
        <div className="job-progress" style={{ 
          marginTop: 'var(--space-4)', 
          padding: 'var(--space-4)', 
          backgroundColor: 'var(--gray-50)', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--gray-200)'
        }}>
          <h4 style={{ margin: '0 0 var(--space-2) 0' }}>Archive Progress</h4>
          <div className="job-status" style={{ marginBottom: 'var(--space-2)' }}>
            <strong>Status:</strong> {getJobStatusMessage()}
          </div>
          
          {currentJob.progress && currentJob.progress.currentPage && (
            <div className="current-page" style={{ 
              fontSize: '0.9em', 
              opacity: 0.8,
              marginBottom: 'var(--space-2)',
              wordBreak: 'break-all'
            }}>
              <strong>Current:</strong> {currentJob.progress.currentPage}
            </div>
          )}
          
          {currentJob.status === 'running' && (
            <div className="progress-bar" style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: 'var(--gray-200)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div 
                className="progress-fill" 
                style={{
                  width: `${Math.min(100, (currentJob.progress.pagesProcessed / maxPages) * 100)}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary-500)',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>
          )}
        </div>
      )}

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