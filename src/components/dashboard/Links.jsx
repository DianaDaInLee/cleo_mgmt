const LINKS = [
  {
    label: 'Demographic Data Summary',
    url: 'https://docs.google.com/document/d/1xUImrZK4RSslUz2QhvSXJyiE3bz0igWVy30IFZnptU8/edit?tab=t.0',
    icon: '📊',
    desc: 'Google Doc',
  },
  {
    label: 'Election Data Summary',
    url: 'https://docs.google.com/document/d/1ANSg-ou3C6vkC9tY2HfyZrGg9rqUnBfGBYAWEQ1_szE/edit?usp=sharing',
    icon: '🗳️',
    desc: 'Google Doc',
  },
  {
    label: 'Meeting Notes',
    url: 'https://docs.google.com/document/d/1NAGfR3k5GC0G4vlcsUb_1Pt2h5cpPRPVEmcEinYanc4?usp=drive_fs',
    icon: '📝',
    desc: 'Google Doc',
  },
  {
    label: 'Local Election Data Tracker',
    url: 'https://docs.google.com/spreadsheets/d/1RKKQ-C3pl8tBS_6AixcQagHbipm1NSUU5yRF9VUDMmA/edit?usp=sharing',
    icon: '📋',
    desc: 'Google Sheet',
  },
  {
    label: 'Research Hypotheses',
    url: 'https://docs.google.com/document/d/1SdbsUDG14j77axdC6bmeQzHJpgAhMVk9dpKR04GDhjg?usp=drive_fs',
    icon: '🔬',
    desc: 'Google Doc',
  },
  {
    label: 'Final Data',
    url: 'https://www.dropbox.com/scl/fo/u79w8m5i39kbr8sd12nnm/AEY2rO3OHoTxiAiR9pIhvtw?rlkey=4udwelmntgx0fowgbff6x5wcr&st=rypi1lnb&dl=0',
    icon: '📦',
    desc: 'Dropbox',
  },
]

export default function Links() {
  return (
    <div className="card">
      <h2 className="text-base font-semibold text-white mb-4">Resources</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-gray-800 border border-gray-700 hover:border-primary-600 hover:bg-gray-750 transition-all duration-200 group"
          >
            <span className="text-xl leading-none mt-0.5 flex-shrink-0">{link.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                {link.label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
            </div>
            <svg className="w-4 h-4 text-gray-600 group-hover:text-primary-400 flex-shrink-0 ml-auto mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  )
}
