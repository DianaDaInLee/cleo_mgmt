import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from 'firebase/firestore'

const TICK_COLUMNS = [
  { key: 'election_data',       label: 'Election Data' },
  { key: 'election_summary',    label: 'Election Data Summary' },
  { key: 'candidate_race',      label: 'Candidate Race' },
  { key: 'candidate_gender',    label: 'Candidate Gender' },
  { key: 'demo_race',           label: 'Demo: Race' },
  { key: 'demo_gender',         label: 'Demo: Gender' },
  { key: 'demo_religion',       label: 'Demo: Religion' },
  { key: 'demo_education',      label: 'Demo: Education' },
  { key: 'demo_income',         label: 'Demo: Income' },
  { key: 'demo_summary',        label: 'Demo Summary' },
  { key: 'shapefile',           label: 'Shapefile' },
  { key: 'merge',               label: 'Merge' },
]

function defaultRow(name = '') {
  const ticks = {}
  TICK_COLUMNS.forEach(c => { ticks[c.key] = false })
  return { country: name, ledBy: '', ...ticks }
}

export default function Tracker() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCountry, setNewCountry] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [firebaseError, setFirebaseError] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'tracker_rows'), orderBy('createdAt'))
    const unsub = onSnapshot(q,
      (snap) => {
        setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
        setFirebaseError(null)
      },
      (err) => {
        console.error(err)
        setFirebaseError(err.message)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  const handleAddCountry = async (e) => {
    e.preventDefault()
    if (!newCountry.trim()) return
    setAdding(true)
    try {
      await addDoc(collection(db, 'tracker_rows'), {
        ...defaultRow(newCountry.trim()),
        createdAt: Date.now(),
      })
      setNewCountry('')
    } catch (err) {
      console.error(err)
    }
    setAdding(false)
  }

  const handleDeleteRow = async (id) => {
    await deleteDoc(doc(db, 'tracker_rows', id))
    setConfirmDelete(null)
  }

  const handleTickChange = async (id, key, value) => {
    await updateDoc(doc(db, 'tracker_rows', id), { [key]: value })
  }

  const handleLedByChange = async (id, value) => {
    await updateDoc(doc(db, 'tracker_rows', id), { ledBy: value })
  }

  const handleCountryChange = async (id, value) => {
    await updateDoc(doc(db, 'tracker_rows', id), { country: value })
  }

  const completedCount = (row) =>
    TICK_COLUMNS.filter(c => row[c.key]).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Tracker</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track data build progress per country</p>
        </div>

        {/* Add Country form */}
        <form onSubmit={handleAddCountry} className="flex items-center gap-2">
          <input
            type="text"
            value={newCountry}
            onChange={e => setNewCountry(e.target.value)}
            placeholder="Country name…"
            className="input-field w-44"
          />
          <button
            type="submit"
            disabled={adding || !newCountry.trim()}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors duration-200 ${
              adding || !newCountry.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 hover:bg-primary-700 text-white cursor-pointer'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {adding ? 'Adding…' : 'Add Country'}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800/80 border-b border-gray-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap sticky left-0 bg-gray-800/80 z-10 min-w-[140px]">
                  Country
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[120px]">
                  Led By
                </th>
                {TICK_COLUMNS.map(col => (
                  <th key={col.key} className="px-2 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap min-w-[90px] text-center">
                    <span className="block leading-tight">{col.label}</span>
                  </th>
                ))}
                <th className="px-3 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                  Done
                </th>
                <th className="px-3 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={TICK_COLUMNS.length + 4} className="text-center text-gray-500 py-10">
                    Loading…
                  </td>
                </tr>
              )}
              {firebaseError && (
                <tr>
                  <td colSpan={TICK_COLUMNS.length + 4} className="text-center text-red-400 py-10 text-sm px-4">
                    Firebase error: {firebaseError}. Check your Firestore security rules.
                  </td>
                </tr>
              )}
              {!loading && !firebaseError && rows.length === 0 && (
                <tr>
                  <td colSpan={TICK_COLUMNS.length + 4} className="text-center text-gray-600 py-10">
                    No countries yet. Add one above.
                  </td>
                </tr>
              )}
              {rows.map((row, idx) => {
                const done = completedCount(row)
                const allDone = done === TICK_COLUMNS.length
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-800 transition-colors hover:bg-gray-800/30 ${
                      allDone ? 'bg-emerald-900/10' : ''
                    }`}
                  >
                    {/* Country */}
                    <td className="px-4 py-2 sticky left-0 bg-gray-900 border-r border-gray-800 z-10">
                      <input
                        type="text"
                        defaultValue={row.country}
                        onBlur={e => {
                          if (e.target.value !== row.country)
                            handleCountryChange(row.id, e.target.value)
                        }}
                        className="bg-transparent text-gray-200 font-medium text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1"
                      />
                    </td>

                    {/* Led By */}
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        defaultValue={row.ledBy || ''}
                        onBlur={e => {
                          if (e.target.value !== (row.ledBy || ''))
                            handleLedByChange(row.id, e.target.value)
                        }}
                        placeholder="—"
                        className="bg-transparent text-gray-300 text-sm w-full focus:outline-none focus:ring-1 focus:ring-primary-500 rounded px-1 placeholder-gray-600"
                      />
                    </td>

                    {/* Tick columns */}
                    {TICK_COLUMNS.map(col => (
                      <td key={col.key} className="px-2 py-2 text-center">
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!row[col.key]}
                            onChange={e => handleTickChange(row.id, col.key, e.target.checked)}
                            className="sr-only"
                          />
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded border-2 transition-all ${
                              row[col.key]
                                ? 'bg-emerald-500 border-emerald-500'
                                : 'bg-transparent border-gray-600 hover:border-gray-400'
                            }`}
                          >
                            {row[col.key] && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                        </label>
                      </td>
                    ))}

                    {/* Progress */}
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        allDone
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : done > 0
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-gray-700 text-gray-500'
                      }`}>
                        {done}/{TICK_COLUMNS.length}
                      </span>
                    </td>

                    {/* Delete */}
                    <td className="px-3 py-2 text-center">
                      {confirmDelete === row.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >Yes</button>
                          <span className="text-gray-600">/</span>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-500 hover:text-gray-300"
                          >No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(row.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Remove country"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary footer */}
      {rows.length > 0 && (
        <p className="text-xs text-gray-600">
          {rows.filter(r => completedCount(r) === TICK_COLUMNS.length).length} of {rows.length} countries fully complete
        </p>
      )}
    </div>
  )
}
