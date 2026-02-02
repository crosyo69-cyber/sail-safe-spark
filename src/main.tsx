import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/register-sw";
import { initWebVitals } from "./lib/web-vitals";

// Register service worker for offline support and caching
registerServiceWorker();

// Initialize Core Web Vitals monitoring
initWebVitals();

createRoot(document.getElementById("root")!).render(<App />);
