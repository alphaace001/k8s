import { useEffect, useState } from "react";

const App = () => {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    fetch(`${backendUrl}/ping`)
      .then((res) => res.json())
      .then(() => setStatus("connected"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
      <h1>
        {status === "loading"
          ? "Connecting..."
          : status === "connected"
          ? "Connected to backend"
          : "Unable to connect to backend"}
      </h1>
    </div>
  );
};

export default App;
