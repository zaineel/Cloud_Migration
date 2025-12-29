import type { NextApiRequest, NextApiResponse } from "next";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

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

  const { q } = req.query;

  if (!q || typeof q !== "string" || q.trim().length < 2) {
    return res.status(400).json({ 
      error: "Search query must be at least 2 characters",
      users: [] 
    });
  }

  const searchQuery = q.trim().toLowerCase();

  try {
    // Scan for user profiles that match the search query
    // In production, you'd want to use a GSI or OpenSearch for better performance
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "begins_with(PK, :prefix) AND SK = :sk AND (contains(#username, :query) OR contains(#email, :query))",
      ExpressionAttributeNames: {
        "#username": "username",
        "#email": "email",
      },
      ExpressionAttributeValues: {
        ":prefix": "USERNAME#",
        ":sk": "PROFILE",
        ":query": searchQuery,
      },
      Limit: 20,
    };

    const result = await docClient.send(new ScanCommand(params));
    
    const users = (result.Items || []).map((item) => ({
      username: item.username || "",
      email: item.email || "",
      description: item.description || "",
      createdAt: item.createdAt || "",
    }));

    // Sort by username match quality (exact match first, then prefix match)
    users.sort((a, b) => {
      const aLower = a.username.toLowerCase();
      const bLower = b.username.toLowerCase();
      
      // Exact match first
      if (aLower === searchQuery) return -1;
      if (bLower === searchQuery) return 1;
      
      // Then prefix match
      if (aLower.startsWith(searchQuery) && !bLower.startsWith(searchQuery)) return -1;
      if (bLower.startsWith(searchQuery) && !aLower.startsWith(searchQuery)) return 1;
      
      // Then alphabetical
      return aLower.localeCompare(bLower);
    });

    return res.status(200).json({ users: users.slice(0, 10) });
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ error: "Failed to search users", users: [] });
  }
}

