import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

const saved = localStorage.getItem("theme");
if (saved === "dark" || (!saved && window.matchMedia?.("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.dataset.theme = "dark";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
