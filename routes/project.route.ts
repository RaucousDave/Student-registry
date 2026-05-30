import { Router, type Request, type Response } from "express";
import { requireAuth } from "./student.route";
import { db } from "../db/db";
import { eq } from "drizzle-orm";
import { projects, studentProjects } from "../db/schema";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const allProjects = await db.select().from(projects);

    if (allProjects.length <= 0) {
      return res.status(200).json({ message: "No projects as of yet" });
    }
    return res.status(200).json({
      message: "Projects fetched successfully",
      projects: allProjects,
    });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/new", requireAuth, async (req: Request, res: Response) => {
    try {
      const session = (req as any).session;
  
      if (session.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
  
      const { studentIds, title, description, submittedAt } = req.body;
      // studentIds is an array: ["id1", "id2", "id3"]
  
      if (!studentIds?.length || !title || !submittedAt) {
        return res.status(400).json({ error: "studentIds, title and submittedAt are required" });
      }
  
      const projectId = crypto.randomUUID();
  
      const [newProject] = await db
        .insert(projects)
        .values({
          id: projectId,
          title,
          description,
          assignedBy: session.user.id,
          submittedAt,
        })
        .returning();
  
      // link each student to the project
      await db.insert(studentProjects).values(
        studentIds.map((studentId: string) => ({
          studentId,
          projectId,
        }))
      );
  
      return res.status(201).json({ message: "Project assigned successfully", project: newProject });
    } catch (error) {
      console.log("[POST /api/projects/new]: ", error);
    }
  });
router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    const { title, description } = await req.body;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Id is invalid" });
    }

    if (!title) {
      return res.status(400).json({ error: "There must be a title change" });
    }

    await db
      .update(projects)
      .set({ title, description })
      .where(eq(projects.id, id));

    return res.status(200).json({ message: "Project edited successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Id is invalid" });
    }

    await db.delete(projects).where(eq(projects.id, id));
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});
export default router;
