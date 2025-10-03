import { Express } from "express";
import { requireUser } from "../middleware/requireUser";

import userRouter from "./user"; 
import leadsRouter from "./leads";
import projectsRouter from "./projects";
import visitsRouter from "./visits";
import tasksRouter from "./tasks";
import eventsRouter from "./events";

export function registerRoutes(app: Express) {
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", requireUser); 
  app.use("/api/user", userRouter);     
  app.use("/api/leads", leadsRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/visits", visitsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/events", eventsRouter);
}
