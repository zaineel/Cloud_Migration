import type { NextApiRequest, NextApiResponse } from "next";
import { getExamPaper } from "@/lib/dynamodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { paperID } = req.query;

  if (!paperID || typeof paperID !== "string") {
    return res.status(400).json({ error: "Paper ID is required" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const paper = await getExamPaper(paperID);

    if (!paper) {
      return res.status(404).json({ error: "Exam paper not found" });
    }

    return res.status(200).json({ paper });
  } catch (error) {
    console.error("Get exam paper error:", error);
    return res.status(500).json({ error: "Failed to fetch exam paper" });
  }
}
