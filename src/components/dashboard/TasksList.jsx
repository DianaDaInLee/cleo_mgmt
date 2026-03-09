import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

const STATUS_STYLES = {
  'Not Started': 'bg-gray-700 text-gray-300',
  'In Progress': 'bg-amber-900/60 text-amber-300',
  'Completed':   'bg-emerald-900/60 text-emerald-300',
  'Blocked':     'bg-red-900/60 text-red-300',
}

const PRIORITY_STYLES = {
  'High':   'bg-red-900/60 text-red-300',
  'Medium': 'bg-amber-900/60 text-amber-300',
  'Low':    'bg-emerald-900/60 text-emerald-300',
}

export default function TasksList({ onNavigateToTasks }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const formatDate = (str) => {
    if (!str) return '—'
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const isOverdue = (t) => {
    if (!t.dueDate || t.status === 'Completed') return false
    return t.dueDate < new Date().toISOString().slice(0, 10)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Tasks</h2>
        {onNavigateToTasks && (
          <button
            onClick={onNavigateToTasks}
            className="text-xs text-primary-400 hover:text-primary-300 transition-colors font-medium"
          >
            View all →
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-gray-600 py-6 text-center">No tasks yet. Go to the Tasks tab to add one.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Task</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Assignee</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Due</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Priority</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id} className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/20 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-gray-200">{t.name}</div>
                    {t.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{t.notes}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-gray-400">{t.assignee || '—'}</td>
                  <td className={`px-4 py-2.5 text-sm font-medium ${isOverdue(t) ? 'text-red-400' : 'text-gray-400'}`}>
                    {formatDate(t.dueDate)}{isOverdue(t) && ' ⚠'}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${PRIORITY_STYLES[t.priority] || 'bg-gray-700 text-gray-300'}`}>
                      {t.priority || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[t.status] || 'bg-gray-700 text-gray-300'}`}>
                      {t.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
