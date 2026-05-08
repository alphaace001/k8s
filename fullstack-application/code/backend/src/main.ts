import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_BASE_URL,
  credentials: true
}));

app.use(express.json());

const api = express.Router();

app.use("/api", api);

api.get("/ping", (_req, res) => {
  res.json({ message: "pong" });
});

const distPath = path.join(__dirname, "../dist");
const distExists = fs.existsSync(distPath);

if (distExists) {
  app.use(express.static(distPath));
}

app.get("/", (_req, res) => {
  if (!distExists) {
    res.json({ message: "Frontend not built. Debug frontend first." });
    return;
  }
  res.sendFile(path.join(distPath, "index.html"));
});

app.get("*", (_req, res) => {
  if (!distExists) {
    res.json({ message: "Frontend not built. Debug frontend first." });
    return;
  }
  res.sendFile(path.join(distPath, "index.html"));
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Accepting requests from ${process.env.FRONTEND_BASE_URL}`);
});
