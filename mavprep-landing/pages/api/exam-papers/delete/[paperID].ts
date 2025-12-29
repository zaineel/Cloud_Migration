import type { NextApiRequest, NextApiResponse } from "next";
import { getExamPaper, deleteExamPaper } from "@/lib/dynamodb";
import { deleteFile } from "@/lib/s3";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { paperID } = req.query;

  if (!paperID || typeof paperID !== "string") {
    return res.status(400).json({ error: "Paper ID is required" });
  }

  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Get paper to verify ownership
    const paper = await getExamPaper(paperID);

    if (!paper) {
      return res.status(404).json({ error: "Exam paper not found" });
    }

    // TODO: Add authentication check here
    // const currentUserId = await getCurrentUserId(req);
    // if (paper.uploadedBy !== currentUserId) {
    //   return res.status(403).json({ error: "Unauthorized" });
    // }

    // Delete from S3
    await deleteFile(paper.s3Key);

    // Delete from DynamoDB
    await deleteExamPaper(paperID);

    return res.status(200).json({ message: "Exam paper deleted successfully" });
  } catch (error) {
    console.error("Delete exam paper error:", error);
    return res.status(500).json({ error: "Failed to delete exam paper" });
  }
}
