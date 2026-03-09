import Timeline from './Timeline'
import Links from './Links'
import TasksList from './TasksList'

export default function Dashboard({ setActiveTab }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Local Election Data Project — overview & timeline</p>
      </div>
      <Timeline />
      <Links />
      <TasksList onNavigateToTasks={() => setActiveTab('tasks')} />
    </div>
  )
}
