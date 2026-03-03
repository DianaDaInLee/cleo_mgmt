import { useState, useEffect } from 'react'
import { db } from '../../firebase/config'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const TICK_COLUMNS = [
  { key: 'election_data',    label: 'Election Data' },
  { key: 'election_summary', label: 'Election Summary' },
  { key: 'candidate_race',   label: 'Candidate Race' },
  { key: 'candidate_gender', label: 'Candidate Gender' },
  { key: 'demo_race',        label: 'DEM: Race' },
  { key: 'demo_gender',      label: 'DEM: Gender' },
  { key: 'demo_religion',    label: 'DEM: Religion' },
  { key: 'demo_education',   label: 'DEM: Education' },
  { key: 'demo_income',      label: 'DEM: Income' },
  { key: 'demo_age',         label: 'DEM: Age' },
  { key: 'demo_summary',     label: 'DEM Summary' },
  { key: 'shapefile',        label: 'Shapefile' },
  { key: 'merge',            label: 'Merge' },
]

const TOTAL = TICK_COLUMNS.length

const PIE_COLORS = {
  done: '#10b981',   // emerald-500
  todo: '#374151',   // gray-700
}

function CountryPie({ row }) {
  const done = TICK_COLUMNS.filter(c => row[c.key]).length
  const todo = TOTAL - done
  const pct = Math.round((done / TOTAL) * 100)

  const data = [
    { name: 'Complete', value: done },
    { name: 'Remaining', value: todo },
  ]

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex flex-col items-center gap-2">
      <p className="text-sm font-semibold text-gray-200 text-center truncate w-full text-center">
        {row.country}
      </p>
      {row.ledBy && (
        <p className="text-xs text-gray-500 -mt-1">{row.ledBy}</p>
      )}

      <div className="w-28 h-28 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={48}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={idx === 0 ? PIE_COLORS.done : PIE_COLORS.todo}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px',
              }}
              formatter={(val, name) => [`${val}/${TOTAL}`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`text-lg font-bold ${
            pct === 100 ? 'text-emerald-400' : pct > 0 ? 'text-primary-400' : 'text-gray-600'
          }`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Tick summary */}
      <div className="w-full space-y-1">
        {TICK_COLUMNS.map(col => (
          <div key={col.key} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${
              row[col.key] ? 'bg-emerald-500' : 'bg-gray-700'
            }`} />
            <span className={`text-xs truncate ${
              row[col.key] ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {col.label}
            </span>
          </div>
        ))}
      </div>

      <span className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        pct === 100
          ? 'bg-emerald-500/20 text-emerald-400'
          : pct > 0
          ? 'bg-primary-500/20 text-primary-400'
          : 'bg-gray-700 text-gray-500'
      }`}>
        {done}/{TOTAL} complete
      </span>
    </div>
  )
}

// Overall donut chart
function OverallChart({ rows }) {
  const total = rows.length
  const complete = rows.filter(r => TICK_COLUMNS.every(c => r[c.key])).length
  const inProgress = rows.filter(r => {
    const done = TICK_COLUMNS.filter(c => r[c.key]).length
    return done > 0 && done < TOTAL
  }).length
  const notStarted = rows.filter(r => TICK_COLUMNS.every(c => !r[c.key])).length

  const data = [
    { name: 'Complete', value: complete, color: '#10b981' },
    { name: 'In Progress', value: inProgress, color: '#5c7cfa' },
    { name: 'Not Started', value: notStarted, color: '#374151' },
  ].filter(d => d.value > 0)

  if (total === 0) return null

  return (
    <div className="card flex flex-col sm:flex-row items-center gap-6">
      <div className="w-36 h-36 relative flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={62}
              startAngle={90}
              endAngle={-270}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
                fontSize: '12px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
          <span className="text-2xl font-bold text-white">{complete}</span>
          <span className="text-xs text-gray-500">of {total}</span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-base font-semibold text-white mb-1">Overall Completion</h3>
        <p className="text-sm text-gray-400 mb-4">
          <span className="text-emerald-400 font-semibold">{complete}</span> of{' '}
          <span className="font-semibold text-gray-200">{total}</span> countries fully completed
        </p>
        <div className="space-y-2">
          {[
            { label: 'Complete', value: complete, color: 'bg-emerald-500' },
            { label: 'In Progress', value: inProgress, color: 'bg-primary-500' },
            { label: 'Not Started', value: notStarted, color: 'bg-gray-700' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-sm flex-shrink-0 ${item.color}`} />
              <span className="text-sm text-gray-400 w-24">{item.label}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: total ? `${(item.value / total) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-sm font-medium text-gray-300 w-6 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Progress() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'complete' | 'in_progress' | 'not_started'

  useEffect(() => {
    const q = query(collection(db, 'tracker_rows'), orderBy('createdAt'))
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = rows.filter(r => {
    const done = TICK_COLUMNS.filter(c => r[c.key]).length
    if (filter === 'complete') return done === TOTAL
    if (filter === 'in_progress') return done > 0 && done < TOTAL
    if (filter === 'not_started') return done === 0
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Progress</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overall project completion across all countries</p>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm py-10 text-center">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="card text-center text-gray-600 py-12">
          No countries in tracker yet. Add them in the Tracker tab.
        </div>
      ) : (
        <>
          <OverallChart rows={rows} />

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
            {[
              { id: 'all', label: 'All' },
              { id: 'complete', label: 'Complete' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'not_started', label: 'Not Started' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === f.id
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Country pie charts grid */}
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-600">No countries match this filter.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map(row => (
                <CountryPie key={row.id} row={row} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
