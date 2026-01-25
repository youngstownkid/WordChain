import React from "react";
import ReactDOM from "react-dom/client";
import WordGame from "./word_chain";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WordGame />
  </React.StrictMode>,
);
