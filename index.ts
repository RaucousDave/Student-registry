import { toNodeHandler } from "better-auth/node";
import type { Request, Response } from "express";
import express from "express";
import { auth } from "./auth";
import studentsRouter from "./routes/student.route";
import projectRouter from "./routes/project.route";
import scoreRouter from "./routes/score.route";

const app = express();

const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  const method = req.method;
  const url = req.url;
  const time = new Date().toLocaleTimeString();

  console.log(`[${method}] - [${time}] - [${url}]`);
  next();
});
app.use("/api/auth/*splat", toNodeHandler(auth));
app.use("/api/students", studentsRouter);
app.use("/api/projects", projectRouter);
app.use("/api/scores", scoreRouter);
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ message: "API called successfully" });
});

app.listen(PORT, () => {
  console.log("Server is running on Port: ", PORT);
});
