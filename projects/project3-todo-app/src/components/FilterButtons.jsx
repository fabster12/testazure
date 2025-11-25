function FilterButtons({ filter, onFilterChange, onClearCompleted, hasCompleted }) {
  const filters = ['all', 'active', 'completed']

  return (
    <div className="filter-buttons">
      <div className="filter-group">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {hasCompleted && (
        <button
          onClick={onClearCompleted}
          className="clear-btn"
        >
          Clear Completed
        </button>
      )}
    </div>
  )
}

export default FilterButtons
