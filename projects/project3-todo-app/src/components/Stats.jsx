function Stats({ total, active, completed }) {
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="stats">
      <div className="stat">
        <span className="stat-value">{total}</span>
        <span className="stat-label">Total</span>
      </div>
      <div className="stat">
        <span className="stat-value">{active}</span>
        <span className="stat-label">Active</span>
      </div>
      <div className="stat">
        <span className="stat-value">{completed}</span>
        <span className="stat-label">Completed</span>
      </div>
      <div className="stat">
        <span className="stat-value">{completionRate}%</span>
        <span className="stat-label">Progress</span>
      </div>
    </div>
  )
}

export default Stats
