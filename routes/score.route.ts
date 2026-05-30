import { Router, type Request, type Response } from "express";
import { db } from "../db/db";
import { requireAuth } from "./student.route";
import { scores, studentProjects, students } from "../db/schema";
import { and, eq } from "drizzle-orm";

const router = Router();

router.post("/new", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    if (session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { studentId, projectId, category, score } = req.body;

    if (!studentId || !projectId || !category || score === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [assignment] = await db
      .select()
      .from(studentProjects)
      .where(
        and(
          eq(studentProjects.studentId, studentId),
          eq(studentProjects.projectId, projectId),
        ),
      );

    if (!assignment) {
      return res
        .status(400)
        .json({ error: "Student was not assigned to this project" });
    }

    const [newScore] = await db
      .insert(scores)
      .values({
        id: crypto.randomUUID(),
        studentId,
        projectId,
        category,
        score,
      })
      .returning({
        category: scores.category,
        score: scores.score,
        studentId: scores.studentId,
        projectId: scores.projectId,
      })

    return res
      .status(201)
      .json({ message: "Score set successfully", score: newScore });
  } catch (error) {
    console.log("POST [api/scores/new]: ", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/:studentId", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    if (session.user.role != "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const studentId = req.params.studentId;

    if (!studentId || typeof studentId !== "string") {
      return res.status(400).json({ error: "Student Id is invalid" });
    }

    const [existingStudent] = await db
      .select()
      .from(students)
      .where(eq(students.id, studentId));

    if (!existingStudent) {
      return res.status(400).json({ error: "Student does not exist" });
    }

    const studentScores = await db.query.scores.findMany({
      where: eq(scores.studentId, studentId),
      with: {
        project: true,
      },
    });
    return res.status(200).json({ scores: studentScores });
  } catch (error) {
    return res.status(500).json({ error: "Something went wrong" });
  }
});

export default router;
