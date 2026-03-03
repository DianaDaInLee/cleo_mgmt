import { useState, useEffect, useRef } from 'react'
import { db } from '../../firebase/config'
import {
  collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy
} from 'firebase/firestore'

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']

const EVENT_COLORS = [
  { label: 'Blue',   bg: 'bg-primary-600',  border: 'border-primary-500',  text: 'text-white' },
  { label: 'Green',  bg: 'bg-emerald-600',  border: 'border-emerald-500',  text: 'text-white' },
  { label: 'Purple', bg: 'bg-purple-600',   border: 'border-purple-500',   text: 'text-white' },
  { label: 'Orange', bg: 'bg-orange-500',   border: 'border-orange-400',   text: 'text-white' },
  { label: 'Red',    bg: 'bg-red-600',      border: 'border-red-500',      text: 'text-white' },
  { label: 'Teal',   bg: 'bg-teal-600',     border: 'border-teal-500',     text: 'text-white' },
]

// Build an array of all ISO weeks for a given year (Mon–Sun)
function buildWeeks(year) {
  const weeks = []
  // Start from Jan 1 of the year; go back to Monday
  let d = new Date(year, 0, 1)
  // roll back to Monday (0=Sun,1=Mon,...,6=Sat)
  const dow = d.getDay() // 0=Sun
  const offset = dow === 0 ? 6 : dow - 1
  d.setDate(d.getDate() - offset)

  while (true) {
    const weekStart = new Date(d)
    const weekEnd = new Date(d)
    weekEnd.setDate(weekEnd.getDate() + 6)

    // include week if it overlaps with the year
    if (weekStart.getFullYear() > year && weekEnd.getFullYear() > year) break

    weeks.push({ start: new Date(weekStart), end: new Date(weekEnd) })
    d.setDate(d.getDate() + 7)
  }
  return weeks
}

function fmt(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function Timeline() {
  const today = new Date()
  const currentYear = today.getFullYear()

  const [displayYear, setDisplayYear] = useState(currentYear)
  const [events, setEvents] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', startDate: '', endDate: '', colorIdx: 0 })
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef(null)
  const todayColRef = useRef(null)

  const weeks = buildWeeks(displayYear)

  // Group weeks by month for header
  const monthGroups = []
  weeks.forEach((w, i) => {
    // Use the month that contains Thursday (ISO standard) or start of week
    const mid = new Date(w.start)
    mid.setDate(mid.getDate() + 3)
    const month = mid.getFullYear() === displayYear ? mid.getMonth() : (w.start.getFullYear() === displayYear ? w.start.getMonth() : w.end.getMonth())
    if (!monthGroups.length || monthGroups[monthGroups.length - 1].month !== month) {
      monthGroups.push({ month, startIdx: i, count: 1 })
    } else {
      monthGroups[monthGroups.length - 1].count++
    }
  })

  // Firebase listener
  useEffect(() => {
    const q = query(collection(db, 'timeline_events'), orderBy('startDate'))
    const unsub = onSnapshot(q, (snap) => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  // Scroll to current week on mount / year change
  useEffect(() => {
    if (displayYear === currentYear && todayColRef.current && scrollRef.current) {
      setTimeout(() => {
        todayColRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }, 100)
    }
  }, [displayYear])

  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.startDate || !newEvent.endDate) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'timeline_events'), {
        title: newEvent.title,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        colorIdx: newEvent.colorIdx,
      })
      setNewEvent({ title: '', startDate: '', endDate: '', colorIdx: 0 })
      setShowModal(false)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm('Remove this event?')) return
    await deleteDoc(doc(db, 'timeline_events', id))
  }

  // Determine which events overlap a given week
  const eventsForWeek = (week) => {
    return events.filter(ev => {
      const evStart = new Date(ev.startDate)
      const evEnd = new Date(ev.endDate)
      return evStart <= week.end && evEnd >= week.start
    })
  }

  const isCurrentWeek = (week) => {
    return today >= week.start && today <= week.end
  }

  const todayWeekIdx = weeks.findIndex(w => isCurrentWeek(w))

  // Assign event rows to prevent overlap (simple greedy)
  const eventRows = {}
  const rowTracker = {} // rowTracker[rowN] = lastEndDate
  events.forEach(ev => {
    let row = 0
    while (true) {
      const lastEnd = rowTracker[row]
      if (!lastEnd || new Date(ev.startDate) > lastEnd) {
        rowTracker[row] = new Date(ev.endDate)
        eventRows[ev.id] = row
        break
      }
      row++
    }
  })
  const totalRows = Math.max(0, ...Object.values(eventRows)) + 1

  const CELL_W = 56 // px per week column

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Timeline</h2>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-0.5">
            <button onClick={() => setDisplayYear(y => y - 1)} className="btn-ghost py-1 px-2 text-xs">
              ‹ {displayYear - 1}
            </button>
            <span className="px-3 text-sm font-medium text-gray-200">{displayYear}</span>
            <button onClick={() => setDisplayYear(y => y + 1)} className="btn-ghost py-1 px-2 text-xs">
              {displayYear + 1} ›
            </button>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Event
        </button>
      </div>

      {/* Scrollable grid */}
      <div ref={scrollRef} className="overflow-x-auto rounded-lg border border-gray-800">
        <div style={{ minWidth: `${weeks.length * CELL_W}px` }}>
          {/* Month header */}
          <div className="flex border-b border-gray-800 bg-gray-800/50">
            {monthGroups.map((mg) => (
              <div
                key={mg.month}
                style={{ width: `${mg.count * CELL_W}px`, minWidth: `${mg.count * CELL_W}px` }}
                className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider py-2 border-r border-gray-700 last:border-r-0"
              >
                {MONTHS[mg.month]}
              </div>
            ))}
          </div>

          {/* Week number row */}
          <div className="flex border-b border-gray-700">
            {weeks.map((w, i) => {
              const isCurrent = isCurrentWeek(w)
              return (
                <div
                  key={i}
                  ref={isCurrent ? todayColRef : null}
                  style={{ width: `${CELL_W}px`, minWidth: `${CELL_W}px` }}
                  className={`text-center text-xs py-1.5 border-r border-gray-800 last:border-r-0 select-none ${
                    isCurrent ? 'bg-primary-900/50 text-primary-300 font-semibold' : 'text-gray-600'
                  }`}
                >
                  {w.start.getDate()}/{w.start.getMonth() + 1}
                </div>
              )
            })}
          </div>

          {/* Events area */}
          <div
            className="relative bg-gray-900/50"
            style={{ height: `${Math.max(totalRows * 30 + 12, 60)}px` }}
          >
            {/* Column highlights */}
            <div className="absolute inset-0 flex pointer-events-none">
              {weeks.map((w, i) => (
                <div
                  key={i}
                  style={{ width: `${CELL_W}px`, minWidth: `${CELL_W}px` }}
                  className={`border-r border-gray-800 last:border-r-0 h-full ${
                    isCurrentWeek(w) ? 'bg-primary-900/20' : ''
                  }`}
                />
              ))}
            </div>

            {/* Event bars */}
            {events.map(ev => {
              const evStart = new Date(ev.startDate)
              const evEnd = new Date(ev.endDate)
              const color = EVENT_COLORS[ev.colorIdx ?? 0]

              // Find first and last overlapping week columns
              let colStart = -1, colEnd = -1
              weeks.forEach((w, i) => {
                if (evStart <= w.end && evEnd >= w.start) {
                  if (colStart === -1) colStart = i
                  colEnd = i
                }
              })
              if (colStart === -1) return null

              const row = eventRows[ev.id] ?? 0
              const left = colStart * CELL_W + 2
              const width = (colEnd - colStart + 1) * CELL_W - 4
              const top = 6 + row * 30

              return (
                <div
                  key={ev.id}
                  style={{ left, width, top, height: 24, position: 'absolute' }}
                  className={`rounded-md px-2 flex items-center justify-between gap-1 group cursor-default ${color.bg} ${color.text}`}
                >
                  <span className="text-xs font-medium truncate">{ev.title}</span>
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hover:bg-black/20 rounded p-0.5"
                    title="Remove event"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      {events.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {events.map(ev => {
            const color = EVENT_COLORS[ev.colorIdx ?? 0]
            return (
              <span key={ev.id} className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text} opacity-80`}>
                {ev.title}
                <span className="opacity-60">
                  {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(ev.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </span>
            )
          })}
        </div>
      )}

      {/* Add Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md">
            <h3 className="text-base font-semibold text-white mb-4">Add Event</h3>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Event name</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                  className="input-field w-full"
                  placeholder="e.g. Data collection sprint"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start date</label>
                  <input
                    type="date"
                    value={newEvent.startDate}
                    onChange={e => setNewEvent(p => ({ ...p, startDate: e.target.value }))}
                    className="input-field w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End date</label>
                  <input
                    type="date"
                    value={newEvent.endDate}
                    onChange={e => setNewEvent(p => ({ ...p, endDate: e.target.value }))}
                    className="input-field w-full"
                    min={newEvent.startDate}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Color</label>
                <div className="flex gap-2">
                  {EVENT_COLORS.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewEvent(p => ({ ...p, colorIdx: idx }))}
                      className={`w-7 h-7 rounded-full ${c.bg} border-2 transition-all ${
                        newEvent.colorIdx === idx ? 'border-white scale-110' : 'border-transparent'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Saving…' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
