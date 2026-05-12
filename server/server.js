import express from "express";
import cors from "cors";
import taskRoutes from "./routes/tasks.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/api/tasks", taskRoutes);

app.get("/", (req, res) => res.json({ message: "Server running" }));

// ← เพิ่มส่วนนี้
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
