const STATUS_COLORS = {
  permanent: 'bg-status-green',
  job_order: 'bg-status-amber',
  contract_of_service: 'bg-navy',
  active: 'bg-status-green',
  probationary: 'bg-status-amber',
  terminated: 'bg-status-red',
  inactive: 'bg-status-red'
}

export function StatusDot({ status }) {
  const color = STATUS_COLORS[String(status).toLowerCase()] || 'bg-status-amber'
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
}
