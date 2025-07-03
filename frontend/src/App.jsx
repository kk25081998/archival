import { Routes, Route } from 'react-router-dom'
import ArchiveForm from './components/ArchiveForm'
import SnapshotViewer from './components/SnapshotViewer'

function App() {
  return (
    <div className="container">
      <h1>Web Archival Tool</h1>
      <Routes>
        <Route path="/" element={<ArchiveForm />} />
        <Route path="/view/:host/:timestamp" element={<SnapshotViewer />} />
      </Routes>
    </div>
  )
}

export default App 