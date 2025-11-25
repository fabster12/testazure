import { useState } from 'react'

function TodoInput({ onAdd }) {
  const [input, setInput] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onAdd(input.trim())
      setInput('')
    }
  }

  return (
    <form className="todo-input" onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
      />
      <button type="submit">Add</button>
    </form>
  )
}

export default TodoInput
