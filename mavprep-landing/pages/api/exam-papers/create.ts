import type { NextApiRequest, NextApiResponse } from "next";
import { createExamPaper, type ExamPaper } from "@/lib/dynamodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const paperData: ExamPaper = req.body;

    // Validate required fields
    if (
      !paperData.paperID ||
      !paperData.courseCode ||
      !paperData.semester ||
      !paperData.year ||
      !paperData.professor ||
      !paperData.examType ||
      !paperData.fileName ||
      !paperData.s3Key ||
      !paperData.uploadedBy
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate exam type
    if (!["midterm", "final", "quiz"].includes(paperData.examType)) {
      return res.status(400).json({ error: "Invalid exam type" });
    }

    // Validate semester
    if (!["Fall", "Spring", "Summer"].includes(paperData.semester)) {
      return res.status(400).json({ error: "Invalid semester" });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (paperData.year < 2000 || paperData.year > currentYear + 1) {
      return res.status(400).json({ error: "Invalid year" });
    }

    await createExamPaper(paperData);

    return res.status(201).json({
      message: "Exam paper created successfully",
      paperID: paperData.paperID,
    });
  } catch (error) {
    console.error("Create exam paper error:", error);
    return res.status(500).json({ error: "Failed to create exam paper" });
  }
}
