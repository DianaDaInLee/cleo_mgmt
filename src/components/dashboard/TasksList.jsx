import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

const PRIORITY_STYLES = {
  'High':   'bg-red-900/60 text-red-300',
  'Medium': 'bg-amber-900/60 text-amber-300',
  'Low':    'bg-emerald-900/60 text-emerald-300',
}

function computeProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) return null
  return Math.round(subtasks.filter(s => s.completed).length / subtasks.length * 100)
}

function ProgressBar({ progress }) {
  if (progress === null) return <span className="text-xs text-gray-600">—</span>
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 w-7 text-right shrink-0">{progress}%</span>
    </div>
  )
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
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Assignee</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Due</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Priority</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">Progress</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => {
                const progress = computeProgress(t.subtasks)
                return (
                  <tr key={t.id} className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/20 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-gray-200">{t.name}</div>
                      {(t.subtasks || []).length > 0 && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {(t.subtasks || []).filter(s => s.completed).length}/{(t.subtasks || []).length} subtasks
                        </div>
                      )}
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
                      <ProgressBar progress={progress} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
