import type { NextApiRequest, NextApiResponse } from "next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { username } = req.query;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const params = {
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND SK = :sk",
      ExpressionAttributeValues: {
        ":pk": `USERNAME#${username.toLowerCase()}`,
        ":sk": "PROFILE",
      },
    };

    const result = await docClient.send(new QueryCommand(params));

    if (!result.Items || result.Items.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const item = result.Items[0];
    const profile = {
      username: item.username || username,
      email: item.email || "",
      description: item.description || null,
      createdAt: item.createdAt || null,
    };

    return res.status(200).json({ profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ error: "Failed to fetch user profile" });
  }
}

