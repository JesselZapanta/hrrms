const STATUS_COLORS = {
  permanent: 'bg-success-bar',
  job_order: 'bg-warning-bar',
  contract_of_service: 'bg-tile-blue',
  active: 'bg-success-bar',
  probationary: 'bg-warning-bar',
  terminated: 'bg-danger-text',
  inactive: 'bg-danger-text'
}

export function StatusDot({ status }) {
  const color = STATUS_COLORS[String(status).toLowerCase()] || 'bg-warning-bar'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
}
