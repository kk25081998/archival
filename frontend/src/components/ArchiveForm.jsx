import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

function ArchiveForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

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

  return (
    <div>
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
            <label htmlFor="url">Website URL:</label>
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
              <span>
                <div className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', marginRight: '8px' }}></div>
                Archiving...
              </span>
            ) : (
              'Archive Website'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ArchiveForm 