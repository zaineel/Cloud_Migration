import type { NextApiRequest, NextApiResponse } from "next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: process.env.MAVPREP_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MAVPREP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.MAVPREP_AWS_SECRET_ACCESS_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "MavPrepData";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { oldUsername, newUsername, userId } = req.body;

  if (!oldUsername || !newUsername || !userId) {
    return res.status(400).json({ 
      error: "Missing required fields: oldUsername, newUsername, userId" 
    });
  }

  try {
    // Delete the old username reservation
    // (New username was already reserved in check-username POST)
    const deleteParams = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USERNAME#${oldUsername.toLowerCase()}`,
        SK: "PROFILE",
      },
    };

    await docClient.send(new DeleteCommand(deleteParams));

    return res.status(200).json({ 
      success: true, 
      message: "Username updated successfully" 
    });
  } catch (error: unknown) {
    console.error("Error updating username:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ 
      error: "Failed to update username", 
      details: errorMessage 
    });
  }
}

