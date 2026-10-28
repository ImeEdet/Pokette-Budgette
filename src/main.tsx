import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/fredoka/400.css";
import "@fontsource/fredoka/500.css";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/700.css";
import "@fontsource/patrick-hand";
import "@fontsource/caveat/400.css";
import "@fontsource/dynapuff/400.css";
import App from "./App";
import "./styles.css";
import "./budget.css";
import "./theme.css";
import { initializeTheme } from "./theme";
initializeTheme();
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
