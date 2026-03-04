import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from 'firebase/firestore'

export default function DivisionOfLabor() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newAssignment, setNewAssignment] = useState({ name: '', detail: '' })

  // For inline editing
  const [editingId, setEditingId] = useState(null)
  const [editValues, setEditValues] = useState({ name: '', detail: '' })
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'assignments'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snap) => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newAssignment.name.trim() && !newAssignment.detail.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'assignments'), {
        name: newAssignment.name.trim(),
        detail: newAssignment.detail.trim(),
        createdAt: Date.now(),
      })
      setNewAssignment({ name: '', detail: '' })
      setShowModal(false)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const startEdit = (a) => {
    setEditingId(a.id)
    setEditValues({ name: a.name, detail: a.detail })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    try {
      await updateDoc(doc(db, 'assignments', editingId), {
        name: editValues.name.trim(),
        detail: editValues.detail.trim(),
      })
    } catch (err) {
      console.error(err)
    }
    setEditingId(null)
  }

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'assignments', id))
    setConfirmDelete(null)
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white">Division of Labor</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Assignment
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 py-4 text-center">Loading…</p>
      ) : assignments.length === 0 ? (
        <p className="text-sm text-gray-600 py-6 text-center">No assignments yet. Add one above.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/60 border-b border-gray-700">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider w-48">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Assignment Detail
                </th>
                <th className="px-4 py-2.5 w-24" />
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} className="border-b border-gray-800 last:border-b-0 hover:bg-gray-800/20 transition-colors">
                  {editingId === a.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editValues.name}
                          onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))}
                          className="input-field w-full"
                          autoFocus
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editValues.detail}
                          onChange={e => setEditValues(v => ({ ...v, detail: e.target.value }))}
                          className="input-field w-full"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={handleSaveEdit}
                            className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 text-gray-200 font-medium">{a.name}</td>
                      <td className="px-4 py-2.5 text-gray-400">{a.detail}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3 justify-end">
                          {confirmDelete === a.id ? (
                            <>
                              <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-300 font-medium">Yes</button>
                              <span className="text-gray-600">|</span>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-500 hover:text-gray-300">No</button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(a)}
                                className="text-gray-500 hover:text-primary-400 transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setConfirmDelete(a.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors"
                                title="Delete"
                              >
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <h3 className="text-base font-semibold text-white mb-4">Add Assignment</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={newAssignment.name}
                  onChange={e => setNewAssignment(v => ({ ...v, name: e.target.value }))}
                  className="input-field w-full"
                  placeholder="e.g. Diana"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Assignment Detail</label>
                <input
                  type="text"
                  value={newAssignment.detail}
                  onChange={e => setNewAssignment(v => ({ ...v, detail: e.target.value }))}
                  className="input-field w-full"
                  placeholder="e.g. Election data collection for Latin America"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setNewAssignment({ name: '', detail: '' }) }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
