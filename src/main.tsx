import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/register-sw";
import { initGA4 } from "./lib/analytics";
import { initWebVitals } from "./lib/web-vitals";

// Register service worker for offline support and caching
registerServiceWorker();

// Initialize Google Analytics 4 (must be before web vitals)
initGA4();

// Initialize Core Web Vitals monitoring (sends to GA4 if configured)
initWebVitals();

createRoot(document.getElementById("root")!).render(<App />);

createRoot(document.getElementById("root")!).render(<App />);
