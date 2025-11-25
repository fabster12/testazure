import { useState, useEffect } from 'react'
import TodoInput from './components/TodoInput'
import TodoList from './components/TodoList'
import FilterButtons from './components/FilterButtons'
import Stats from './components/Stats'
import './App.css'

function App() {
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos')
    return savedTodos ? JSON.parse(savedTodos) : []
  })
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = (text) => {
    const newTodo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date().toISOString()
    }
    setTodos([newTodo, ...todos])
  }

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ))
  }

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  const editTodo = (id, newText) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    ))
  }

  const clearCompleted = () => {
    setTodos(todos.filter(todo => !todo.completed))
  }

  const getFilteredTodos = () => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed)
      case 'completed':
        return todos.filter(todo => todo.completed)
      default:
        return todos
    }
  }

  const filteredTodos = getFilteredTodos()
  const activeCount = todos.filter(todo => !todo.completed).length
  const completedCount = todos.filter(todo => todo.completed).length

  return (
    <div className="app">
      <header>
        <h1>Todo App</h1>
        <p className="subtitle">Stay organized and productive</p>
      </header>

      <div className="container">
        <TodoInput onAdd={addTodo} />
        <Stats
          total={todos.length}
          active={activeCount}
          completed={completedCount}
        />
        <FilterButtons
          filter={filter}
          onFilterChange={setFilter}
          onClearCompleted={clearCompleted}
          hasCompleted={completedCount > 0}
        />
        <TodoList
          todos={filteredTodos}
          onToggle={toggleTodo}
          onDelete={deleteTodo}
          onEdit={editTodo}
        />
        {filteredTodos.length === 0 && (
          <div className="empty-state">
            <p>
              {filter === 'active' && 'No active todos. Great job!'}
              {filter === 'completed' && 'No completed todos yet.'}
              {filter === 'all' && todos.length === 0 && 'No todos yet. Add one to get started!'}
              {filter === 'all' && todos.length > 0 && 'All todos are filtered out.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
