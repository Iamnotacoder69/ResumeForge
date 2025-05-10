import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/qwalify-theme.css"; // Import Qwalify custom styling
import { ThemeProvider } from 'next-themes';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="light">
    <App />
  </ThemeProvider>
);
