import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from 'firebase/firestore'

const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked']
const PRIORITIES = ['High', 'Medium', 'Low']

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

const EMPTY_TASK = { name: '', assignee: '', dueDate: '', priority: 'Medium', status: 'Not Started', notes: '' }

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

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState(EMPTY_TASK)
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState(EMPTY_TASK)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [subtaskInputs, setSubtaskInputs] = useState({}) // { taskId: string }

  useEffect(() => {
    const q = query(collection(db, 'tasks'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newTask.name.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'tasks'), {
        name:      newTask.name.trim(),
        assignee:  newTask.assignee.trim(),
        dueDate:   newTask.dueDate,
        priority:  newTask.priority,
        status:    newTask.status,
        notes:     newTask.notes.trim(),
        subtasks:  [],
        progress:  null,
        createdAt: Date.now(),
      })
      setNewTask(EMPTY_TASK)
      setShowModal(false)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setEditValues({
      name:     t.name,
      assignee: t.assignee || '',
      dueDate:  t.dueDate || '',
      priority: t.priority || 'Medium',
      status:   t.status || 'Not Started',
      notes:    t.notes || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    try {
      await updateDoc(doc(db, 'tasks', editingId), {
        name:     editValues.name.trim(),
        assignee: editValues.assignee.trim(),
        dueDate:  editValues.dueDate,
        priority: editValues.priority,
        status:   editValues.status,
        notes:    editValues.notes.trim(),
      })
    } catch (err) {
      console.error(err)
    }
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'tasks', id))
    setConfirmDelete(null)
    if (expandedId === id) setExpandedId(null)
  }

  // Subtask helpers
  const toggleSubtask = async (task, subtaskId) => {
    const updated = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    )
    await updateDoc(doc(db, 'tasks', task.id), {
      subtasks: updated,
      progress: computeProgress(updated),
    })
  }

  const addSubtask = async (task) => {
    const name = (subtaskInputs[task.id] || '').trim()
    if (!name) return
    const updated = [...(task.subtasks || []), { id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, name, completed: false }]
    await updateDoc(doc(db, 'tasks', task.id), {
      subtasks: updated,
      progress: computeProgress(updated),
    })
    setSubtaskInputs(v => ({ ...v, [task.id]: '' }))
  }

  const deleteSubtask = async (task, subtaskId) => {
    const updated = (task.subtasks || []).filter(s => s.id !== subtaskId)
    await updateDoc(doc(db, 'tasks', task.id), {
      subtasks: updated,
      progress: computeProgress(updated),
    })
  }

  const formatDate = (str) => {
    if (!str) return '—'
    const d = new Date(str + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (t) => {
    if (!t.dueDate || t.status === 'Completed') return false
    return t.dueDate < new Date().toISOString().slice(0, 10)
  }

  const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Tasks</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage and track project tasks</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">All Tasks</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Task
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-600 py-6 text-center">No tasks yet. Add one above.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/60 border-b border-gray-700">
                  <th className="w-8 px-2 py-2.5" />
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Task</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Assignee</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Due Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Priority</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-36">Progress</th>
                  <th className="px-4 py-2.5 w-20" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => {
                  const subtasks = t.subtasks || []
                  const progress = computeProgress(subtasks)
                  const isExpanded = expandedId === t.id
                  const doneCount = subtasks.filter(s => s.completed).length

                  return (
                    <>
                      {/* Main task row */}
                      <tr
                        key={t.id}
                        className={`border-b border-gray-800 transition-colors ${isExpanded ? 'bg-gray-800/30' : 'hover:bg-gray-800/20'}`}
                      >
                        {/* Expand chevron */}
                        <td className="px-2 py-2.5 text-center">
                          <button
                            onClick={() => toggleExpand(t.id)}
                            className="text-gray-600 hover:text-gray-300 transition-colors"
                            title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
                          >
                            <svg
                              className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </td>

                        {editingId === t.id ? (
                          <>
                            <td className="px-4 py-2">
                              <input type="text" value={editValues.name}
                                onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                                className="input-field w-full" autoFocus />
                            </td>
                            <td className="px-4 py-2">
                              <input type="text" value={editValues.assignee} placeholder="Name"
                                onChange={e => setEditValues(v => ({ ...v, assignee: e.target.value }))}
                                className="input-field w-full" />
                            </td>
                            <td className="px-4 py-2">
                              <input type="date" value={editValues.dueDate}
                                onChange={e => setEditValues(v => ({ ...v, dueDate: e.target.value }))}
                                className="input-field w-full" />
                            </td>
                            <td className="px-4 py-2">
                              <select value={editValues.priority}
                                onChange={e => setEditValues(v => ({ ...v, priority: e.target.value }))}
                                className="input-field w-full">
                                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <select value={editValues.status}
                                onChange={e => setEditValues(v => ({ ...v, status: e.target.value }))}
                                className="input-field w-full">
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <ProgressBar progress={progress} />
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2 justify-end">
                                <button onClick={handleSaveEdit} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">Save</button>
                                <button onClick={() => setEditingId(null)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-2.5">
                              <div className="font-medium text-gray-200">{t.name}</div>
                              {t.notes && <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{t.notes}</div>}
                              {subtasks.length > 0 && (
                                <div className="text-xs text-gray-600 mt-0.5">{doneCount}/{subtasks.length} subtasks</div>
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
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[t.status] || 'bg-gray-700 text-gray-300'}`}>
                                {t.status || '—'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5">
                              <ProgressBar progress={progress} />
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-3 justify-end">
                                {confirmDelete === t.id ? (
                                  <>
                                    <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Yes</button>
                                    <span className="text-gray-600">|</span>
                                    <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:text-gray-300">No</button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => startEdit(t)} className="text-gray-500 hover:text-primary-400 transition-colors" title="Edit">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button onClick={() => setConfirmDelete(t.id)} className="text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>

                      {/* Subtask expanded row */}
                      {isExpanded && (
                        <tr key={`${t.id}-subtasks`} className="border-b border-gray-800 bg-gray-900/60">
                          <td colSpan={8} className="px-10 py-3">
                            <div className="space-y-1.5">
                              {subtasks.length === 0 ? (
                                <p className="text-xs text-gray-600 py-1">No subtasks yet. Add one below.</p>
                              ) : (
                                subtasks.map(s => (
                                  <div key={s.id} className="flex items-center gap-3 group">
                                    <input
                                      type="checkbox"
                                      checked={s.completed}
                                      onChange={() => toggleSubtask(t, s.id)}
                                      className="checkbox-cell w-4 h-4 shrink-0"
                                    />
                                    <span className={`flex-1 text-sm ${s.completed ? 'line-through text-gray-600' : 'text-gray-300'}`}>
                                      {s.name}
                                    </span>
                                    <button
                                      onClick={() => deleteSubtask(t, s.id)}
                                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                                      title="Delete subtask"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                ))
                              )}

                              {/* Add subtask input */}
                              <div className="flex items-center gap-2 pt-1.5">
                                <input
                                  type="text"
                                  value={subtaskInputs[t.id] || ''}
                                  onChange={e => setSubtaskInputs(v => ({ ...v, [t.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(t) } }}
                                  placeholder="Add a subtask…"
                                  className="input-field flex-1 py-1.5 text-xs"
                                />
                                <button
                                  onClick={() => addSubtask(t)}
                                  className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors px-2 py-1.5 rounded hover:bg-gray-800"
                                >
                                  + Add
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-lg">
            <h3 className="text-base font-semibold text-white mb-4">Add Task</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Task Name *</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={e => setNewTask(v => ({ ...v, name: e.target.value }))}
                  className="input-field w-full"
                  placeholder="e.g. Collect data for Latin America"
                  autoFocus
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Assignee</label>
                  <input
                    type="text"
                    value={newTask.assignee}
                    onChange={e => setNewTask(v => ({ ...v, assignee: e.target.value }))}
                    className="input-field w-full"
                    placeholder="e.g. Diana"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask(v => ({ ...v, dueDate: e.target.value }))}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select value={newTask.priority}
                    onChange={e => setNewTask(v => ({ ...v, priority: e.target.value }))}
                    className="input-field w-full">
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <select value={newTask.status}
                    onChange={e => setNewTask(v => ({ ...v, status: e.target.value }))}
                    className="input-field w-full">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={newTask.notes}
                  onChange={e => setNewTask(v => ({ ...v, notes: e.target.value }))}
                  className="input-field w-full"
                  placeholder="Optional notes…"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => { setShowModal(false); setNewTask(EMPTY_TASK) }} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
