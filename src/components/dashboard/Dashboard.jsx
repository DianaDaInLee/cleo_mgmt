import Timeline from './Timeline'
import Links from './Links'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Local Election Data Project — overview & timeline</p>
      </div>
      <Timeline />
      <Links />
    </div>
  )
}
