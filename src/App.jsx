import { useState, useEffect } from 'react'
import Login from './components/Login'
import Navigation from './components/Navigation'
import Dashboard from './components/dashboard/Dashboard'
import Tasks from './components/tasks/Tasks'
import Tracker from './components/tracker/Tracker'
import Progress from './components/progress/Progress'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')

  useEffect(() => {
    const auth = sessionStorage.getItem('cleo_auth')
    if (auth === 'true') setIsAuthenticated(true)
  }, [])

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="max-w-screen-2xl mx-auto px-6 py-6">
        {activeTab === 'dashboard' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'tasks' && <Tasks />}
        {activeTab === 'tracker' && <Tracker />}
        {activeTab === 'progress' && <Progress />}
      </main>
    </div>
  )
}
