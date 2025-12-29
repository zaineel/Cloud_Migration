import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Debug endpoint to check environment variables and AWS connectivity
 * DELETE THIS FILE after debugging
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const diagnostics: any = {
    envVars: {
      MAVPREP_AWS_REGION: process.env.MAVPREP_AWS_REGION ? "✓ Set" : "✗ Missing",
      MAVPREP_AWS_ACCESS_KEY_ID: process.env.MAVPREP_AWS_ACCESS_KEY_ID ? "✓ Set" : "✗ Missing",
      MAVPREP_AWS_SECRET_ACCESS_KEY: process.env.MAVPREP_AWS_SECRET_ACCESS_KEY ? "✓ Set" : "✗ Missing",
      DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || "✗ Missing",
      S3_EXAM_PAPERS_BUCKET: process.env.S3_EXAM_PAPERS_BUCKET || "✗ Missing",
    },
    timestamp: new Date().toISOString(),
  };

  // Try to connect to DynamoDB
  try {
    const { DynamoDBClient, ListTablesCommand } = await import("@aws-sdk/client-dynamodb");

    const client = new DynamoDBClient({
      region: process.env.MAVPREP_AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.MAVPREP_AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.MAVPREP_AWS_SECRET_ACCESS_KEY || "",
      },
    });

    const result = await client.send(new ListTablesCommand({}));

    diagnostics.dynamodb = {
      status: "✓ Connected",
      tables: result.TableNames || [],
      targetTable: process.env.DYNAMODB_TABLE_NAME,
      tableExists: result.TableNames?.includes(process.env.DYNAMODB_TABLE_NAME || "") ? "✓ Yes" : "✗ No",
    };
  } catch (error: any) {
    diagnostics.dynamodb = {
      status: "✗ Failed",
      error: error.message,
    };
  }

  return res.status(200).json(diagnostics);
}
