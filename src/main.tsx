import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("Main.tsx loaded");

try {
  const root = document.getElementById("root");
  console.log("Root element:", root);
  if (root) {
    createRoot(root).render(<App />);
    console.log("App rendered");
  }
} catch (error) {
  console.error("Render error:", error);
}
