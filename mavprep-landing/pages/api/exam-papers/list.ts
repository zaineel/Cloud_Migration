import type { NextApiRequest, NextApiResponse } from "next";
import { listExamPapers } from "@/lib/dynamodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { courseCode, semester, year, examType, professor } = req.query;

    const filters: {
      courseCode?: string;
      semester?: string;
      year?: number;
      examType?: string;
      professor?: string;
    } = {};

    if (courseCode && typeof courseCode === "string")
      filters.courseCode = courseCode;
    if (semester && typeof semester === "string") filters.semester = semester;
    if (year && typeof year === "string") filters.year = parseInt(year);
    if (examType && typeof examType === "string") filters.examType = examType;
    if (professor && typeof professor === "string")
      filters.professor = professor;

    const papers = await listExamPapers(filters);

    // Sort by upload date (newest first)
    papers.sort(
      (a, b) =>
        new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    return res.status(200).json({ papers });
  } catch (error) {
    console.error("List exam papers error:", error);
    return res.status(500).json({ error: "Failed to fetch exam papers" });
  }
}
