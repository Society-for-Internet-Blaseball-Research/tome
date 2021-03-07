import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { setup as setupColorScheme } from "./lib/color-scheme";

// TODO button to override media query
setupColorScheme();

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);
