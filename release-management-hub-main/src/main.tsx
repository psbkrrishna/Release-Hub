import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Loaded after Tailwind so the Zerra tokens win where the two overlap.
import './styles/zerra.css'

createRoot(document.getElementById("root")!).render(<App />);
