import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Portal from "./portal/page";
import "./base.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing portal root");

createRoot(root).render(
  <StrictMode>
    <Portal />
  </StrictMode>,
);
