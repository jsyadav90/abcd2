import { useState } from 'react'
import MainLayout from './layouts/MainLayout/MainLayout.jsx'
import Button from './components/Button/Button'
import Input from './components/Input/Input'

function App() {
  const [inputValue, setInputValue] = useState('')
  const [items, setItems] = useState(['React UI ready', 'Use `npm install`', 'Run `npm run dev`'])

  const handleAddItem = () => {
    if (inputValue.trim()) {
      setItems([...items, inputValue])
      setInputValue('')
    }
  }

  return (
    <MainLayout>
      <h2>Basic Components Demo</h2>
      <Input
        label="Add new item"
        placeholder="Enter item name"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Button onClick={handleAddItem}>Add Item</Button>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </MainLayout>
  )
}

export default App
