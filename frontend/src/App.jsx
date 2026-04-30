import { useState } from 'react'
import './App.css'

function App() {
  const [items, setItems] = useState(['React UI ready', 'Use `npm install`', 'Run `npm run dev`'])

  return (
    <div className="app">
      <header className="app-header">
        <h1>ABCD 2.0 Frontend</h1>
        <p>This is your React UI starter.</p>
      </header>
      <main>
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export default App
