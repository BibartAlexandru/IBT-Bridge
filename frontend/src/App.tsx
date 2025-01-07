import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [text, setText] = useState("");

  async function getText() {
    const res = await fetch("http://127.0.01:8000/get_text");
    const text = await res.text();
    console.log(text);
    setText(text);
  }

  useEffect(() => {
    getText();
  }, []);

  return (
    <>
      <h1>The text is: {text}</h1>
    </>
  );
}

export default App;
