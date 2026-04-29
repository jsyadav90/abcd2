import express from "express";
import cors from "cors";
import userRoutes from "./routes/users.js";
import assetRoutes from "./routes/assets.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/assets", assetRoutes);

export default app;