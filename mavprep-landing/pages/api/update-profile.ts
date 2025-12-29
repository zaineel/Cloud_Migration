import type { NextApiRequest, NextApiResponse } from "next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

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

  const { username, description } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Validate description length
  const DESCRIPTION_MAX_LENGTH = 50;
  if (description && description.length > DESCRIPTION_MAX_LENGTH) {
    return res.status(400).json({ 
      error: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less` 
    });
  }

  try {
    // First check if the user profile exists
    const checkParams = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `USERNAME#${username.toLowerCase()}`,
        ":sk": "PROFILE",
      },
    };

    const checkResult = await docClient.send(new QueryCommand(checkParams));
    
    if (!checkResult.Items || checkResult.Items.length === 0) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Update the profile with the new description
    const updateParams = {
      TableName: TABLE_NAME,
      Key: {
        PK: `USERNAME#${username.toLowerCase()}`,
        SK: "PROFILE",
      },
      UpdateExpression: "SET description = :description, updatedAt = :updatedAt",
      ExpressionAttributeValues: {
        ":description": description || "",
        ":updatedAt": new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW" as const,
    };

    const result = await docClient.send(new UpdateCommand(updateParams));

    return res.status(200).json({ 
      success: true, 
      message: "Profile updated",
      profile: result.Attributes 
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}

