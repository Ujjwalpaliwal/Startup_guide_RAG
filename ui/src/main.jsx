import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import DemoOne from "./components/demo";
import "./index.css";

const showDemo = new URLSearchParams(window.location.search).has("demo");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {showDemo ? <DemoOne /> : <App />}
  </React.StrictMode>
);