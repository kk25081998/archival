import { Routes, Route } from 'react-router-dom'
import ArchiveForm from './components/ArchiveForm'
import SnapshotViewer from './components/SnapshotViewer'

function App() {
  return (
    <div className="container">
      <header>
        <h1>Web Archival Tool</h1>
        <p style={{ fontSize: '1.2rem', textAlign: 'center', marginBottom: '3rem', color: 'var(--gray-600)' }}>
          Create snapshots of websites and preserve them for the future
        </p>
      </header>
      
      <Routes>
        <Route path="/" element={<ArchiveForm />} />
        <Route path="/view/:host/:timestamp" element={<SnapshotViewer />} />
      </Routes>
    </div>
  )
}

export default App 