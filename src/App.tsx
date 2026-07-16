import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
// import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <div className="max-w-sm rounded-xl shadow-lg p-6 bg-white">
      <h2 className="text-xl font-bold">Hello</h2>
      <p className="text-gray-600">Tailwind CSS Card</p>
    </div>
    </>
  )
}

export default App
