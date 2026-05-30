import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { auth } from "../auth";
import { fromNodeHeaders } from "better-auth/node";
import { db } from "../db/db";
import { students } from "../db/schema";
import { Router } from "express";
import { eq } from "drizzle-orm";

const router = Router();

router.use(express.json());

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as any).session = session;

  next();
};

router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const allStudents = await db.select().from(students);
    if (allStudents.length <= 0) {
      res.status(400).json({ message: "There are no students" });
      return;
    }
    return res
      .status(200)
      .json({ message: "Student fetch complete", students: allStudents });
  } catch (error) {
    console.log("[GET /api/students]: ", error);
  }
});

router.post("/new", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    const { firstName, lastName, email } = await req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ error: "All fields are required" });
    }

    const [newStudent] = await db
      .insert(students)
      .values({ id: crypto.randomUUID(), firstName, lastName, email })
      .returning();

    if (!newStudent) {
      throw new Error("Something went wrong");
    }

    return res
      .status(201)
      .json({ message: "Student created successfully", student: newStudent });
  } catch (error) {
    console.log("[POST /api/students/new]: ", error);
  }
});

router.patch("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email } = await req.body;

    const id = req.params.id;
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid Id" });
    }

    const [changedStudent] = await db
      .update(students)
      .set({ firstName, lastName, email })
      .where(eq(students.id, id))
      .returning();

    return res.status(200).json({
      meessage: "Student edited successfully",
      student: changedStudent,
    });
  } catch (error) {
    return res.status(400).json({ error: "Something went wrong" });
  }
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Id is invalid" });
    }

    await db.delete(students).where(eq(students.id, id));

    return res.status(200).json({ message: "Student deleted successfully" });
  } catch (error) {
    return res.status(400).json({ error: "Something went wrong" });
  }
});

router.get("/all", requireAuth, async (req: Request, res: Response) => {
  try {
    const session = (req as any).session;

    if (session.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const allStudents = await db.query.students.findMany({
      with: {
        studentProjects: {
          with: {
            project: true, // just the project details, no scores here
          },
        },
        scores: {
          with: {
            project: true, // include project info alongside each score
          },
        },
      },
    });
    return res.status(200).json({ students: allStudents });
  } catch (error) {
    console.log("[GET /api/students/all]: ", error);
  }
});
export default router;
