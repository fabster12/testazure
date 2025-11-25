import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [color, setColor] = useState('#646cff')

  const incrementCount = () => {
    setCount(count + 1)
    setColor(`hsl(${(count * 10) % 360}, 70%, 60%)`)
  }

  const decrementCount = () => {
    setCount(count - 1)
    setColor(`hsl(${(count * 10) % 360}, 70%, 60%)`)
  }

  const resetCount = () => {
    setCount(0)
    setColor('#646cff')
  }

  return (
    <div className="app">
      <h1>Simple React Counter</h1>
      <div className="card">
        <div
          className="counter-display"
          style={{ backgroundColor: color }}
        >
          <h2>{count}</h2>
        </div>
        <div className="button-group">
          <button onClick={decrementCount}>-</button>
          <button onClick={resetCount}>Reset</button>
          <button onClick={incrementCount}>+</button>
        </div>
        <p className="info">
          Click the buttons to update the counter
        </p>
      </div>
    </div>
  )
}

export default App
