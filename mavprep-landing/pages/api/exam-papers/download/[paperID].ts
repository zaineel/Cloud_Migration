import type { NextApiRequest, NextApiResponse } from "next";
import { getExamPaper, incrementDownloadCount } from "@/lib/dynamodb";
import { generateDownloadUrl } from "@/lib/s3";

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
    // Get paper metadata
    const paper = await getExamPaper(paperID);

    if (!paper) {
      return res.status(404).json({ error: "Exam paper not found" });
    }

    // Generate presigned download URL
    const downloadUrl = await generateDownloadUrl(paper.s3Key);

    // Increment download count (fire and forget)
    incrementDownloadCount(paperID).catch((err) =>
      console.error("Failed to increment download count:", err)
    );

    return res.status(200).json({
      downloadUrl,
      fileName: paper.fileName,
    });
  } catch (error) {
    console.error("Download URL generation error:", error);
    return res.status(500).json({ error: "Failed to generate download URL" });
  }
}
