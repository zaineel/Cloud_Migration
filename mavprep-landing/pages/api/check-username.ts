import type { NextApiRequest, NextApiResponse } from "next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

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
  if (req.method === "GET") {
    // Check if username is available
    const { username } = req.query;

    if (!username || typeof username !== "string") {
      return res.status(400).json({ error: "Username is required" });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        available: false, 
        error: "Username must be 3-20 characters, alphanumeric and underscores only" 
      });
    }

    try {
      // Check if username exists (case-insensitive)
      const params = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `USERNAME#${username.toLowerCase()}`,
          ":sk": "PROFILE",
        },
      };

      const result = await docClient.send(new QueryCommand(params));
      const isAvailable = !result.Items || result.Items.length === 0;

      return res.status(200).json({ available: isAvailable });
    } catch (error) {
      console.error("Error checking username:", error);
      return res.status(500).json({ error: "Failed to check username availability" });
    }
  } else if (req.method === "POST") {
    // Reserve a username for a user
    const { username, userId, email, description } = req.body;

    if (!username || !userId || !email) {
      return res.status(400).json({ error: "Username, userId, and email are required" });
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: "Username must be 3-20 characters, alphanumeric and underscores only" 
      });
    }

    // Validate description length if provided
    const DESCRIPTION_MAX_LENGTH = 50;
    if (description && description.length > DESCRIPTION_MAX_LENGTH) {
      return res.status(400).json({ 
        error: `Description must be ${DESCRIPTION_MAX_LENGTH} characters or less` 
      });
    }

    try {
      // First check if username is taken
      const checkParams = {
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `USERNAME#${username.toLowerCase()}`,
          ":sk": "PROFILE",
        },
      };

      const checkResult = await docClient.send(new QueryCommand(checkParams));
      
      if (checkResult.Items && checkResult.Items.length > 0) {
        return res.status(409).json({ error: "Username is already taken" });
      }

      // Reserve the username with profile data
      const putParams = {
        TableName: TABLE_NAME,
        Item: {
          PK: `USERNAME#${username.toLowerCase()}`,
          SK: "PROFILE",
          username: username,
          userId: userId,
          email: email,
          description: description || "",
          createdAt: new Date().toISOString(),
        },
        ConditionExpression: "attribute_not_exists(PK)",
      };

      await docClient.send(new PutCommand(putParams));

      return res.status(201).json({ success: true, message: "Username reserved" });
    } catch (error: unknown) {
      console.error("Error reserving username:", error);
      if (error instanceof Error && error.name === "ConditionalCheckFailedException") {
        return res.status(409).json({ error: "Username is already taken" });
      }
      return res.status(500).json({ error: "Failed to reserve username" });
    }
  } else {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

