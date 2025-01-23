import React from "react";
import "./App.css";
import IBTNavbar from "./components/IBTNavBar/IBTNavbar";

interface Props {
  children: React.ReactNode;
}

export const backend_url = `http://localhost:3000`;

function App({ children }: Props) {
  return (
    <div className="app">
      <IBTNavbar />
      {children}
    </div>
  );
}

export default App;
