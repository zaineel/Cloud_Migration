import type { NextApiRequest, NextApiResponse } from "next";
import { generateUploadUrl } from "@/lib/s3";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { fileName, fileSize } = req.body;

    // Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    // Validate file type (PDF only)
    if (!fileName || !fileName.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Generate unique paperID
    const paperID = `paper-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const s3Key = `exam-papers/${paperID}.pdf`;

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl(s3Key, "application/pdf");

    return res.status(200).json({
      uploadUrl,
      paperID,
      s3Key,
    });
  } catch (error) {
    console.error("Upload URL generation error:", error);
    return res.status(500).json({ error: "Failed to generate upload URL" });
  }
}
