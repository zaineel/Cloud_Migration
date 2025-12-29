import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const client = new DynamoDBClient({
  region: process.env.MAVPREP_AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.MAVPREP_AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.MAVPREP_AWS_SECRET_ACCESS_KEY || "",
  },
});

// Create Document Client for easier data manipulation
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table name from environment
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "MavPrepData";

/*
 * DynamoDB Table Design for MavPrep
 * 
 * Table: MavPrepData
 * 
 * Primary Key:
 *   - PK (Partition Key): String - e.g., "CHANNEL#c-1" or "USER#user-123"
 *   - SK (Sort Key): String - e.g., "METADATA" or "MSG#2024-01-15T10:30:00Z#msg-uuid"
 * 
 * Global Secondary Index (GSI):
 *   - GSI1PK: For alternate access patterns
 *   - GSI1SK: For sorting within GSI
 * 
 * Access Patterns:
 *   1. Get all channels: PK = "CHANNELS", SK begins_with "CHANNEL#"
 *   2. Get channel metadata: PK = "CHANNEL#channelId", SK = "METADATA"
 *   3. Get messages for channel: PK = "CHANNEL#channelId", SK begins_with "MSG#"
 *   4. Get user info: PK = "USER#userId", SK = "PROFILE"
 *   5. Get user's messages: GSI1PK = "USER#userId", GSI1SK begins_with "MSG#"
 */

// ==================== TYPES ====================

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  privacy: "public" | "private";
  password?: string;
  createdBy: string;
  createdAt: string;
  maxMembers?: number;
  course?: string;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
  updatedAt?: string;
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: {
    id: string;
    userName: string;
    content: string;
  };
}

// ==================== CHANNEL OPERATIONS ====================

export async function createChannel(channel: Channel): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      PK: `CHANNEL#${channel.id}`,
      SK: "METADATA",
      GSI1PK: "CHANNELS",
      GSI1SK: `CHANNEL#${channel.id}`,
      ...channel,
      createdAt: channel.createdAt || new Date().toISOString(),
    },
  };

  await docClient.send(new PutCommand(params));
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `CHANNEL#${channelId}`,
      SK: "METADATA",
    },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item as Channel | null;
}

export async function getAllChannels(): Promise<Channel[]> {
  // Try GSI first, fallback to Scan if GSI doesn't exist
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "CHANNELS",
      },
    };

    const result = await docClient.send(new QueryCommand(params));
    return (result.Items as Channel[]) || [];
  } catch (error: unknown) {
    // If GSI doesn't exist, fallback to Scan
    console.warn("GSI1 not available, falling back to Scan:", error);
    
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: "SK = :metadata AND begins_with(PK, :channelPrefix)",
      ExpressionAttributeValues: {
        ":metadata": "METADATA",
        ":channelPrefix": "CHANNEL#",
      },
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    return (result.Items as Channel[]) || [];
  }
}

export async function deleteChannel(channelId: string): Promise<void> {
  // First delete all messages in the channel
  const messages = await getChannelMessages(channelId);
  for (const msg of messages) {
    await deleteMessage(channelId, msg.id, msg.timestamp);
  }

  // Then delete the channel metadata
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `CHANNEL#${channelId}`,
      SK: "METADATA",
    },
  };

  await docClient.send(new DeleteCommand(params));
}

// ==================== MESSAGE OPERATIONS ====================

export async function createMessage(message: Message): Promise<Message> {
  const timestamp = message.timestamp || new Date().toISOString();
  const messageId = message.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const item: Record<string, unknown> = {
    PK: `CHANNEL#${message.channelId}`,
    SK: `MSG#${timestamp}#${messageId}`,
    GSI1PK: `USER#${message.userId}`,
    GSI1SK: `MSG#${timestamp}#${messageId}`,
    id: messageId,
    channelId: message.channelId,
    userId: message.userId,
    userName: message.userName,
    content: message.content,
    timestamp,
    reactions: message.reactions || [],
  };

  // Add replyTo if present
  if (message.replyTo) {
    item.replyTo = message.replyTo;
  }

  const params = {
    TableName: TABLE_NAME,
    Item: item,
  };

  await docClient.send(new PutCommand(params));

  return {
    ...message,
    id: messageId,
    timestamp,
  };
}

export async function getChannelMessages(
  channelId: string,
  limit: number = 50,
  lastKey?: string
): Promise<Message[]> {
  const params: {
    TableName: string;
    KeyConditionExpression: string;
    ExpressionAttributeValues: Record<string, string>;
    Limit: number;
    ScanIndexForward: boolean;
    ExclusiveStartKey?: Record<string, string>;
  } = {
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
    ExpressionAttributeValues: {
      ":pk": `CHANNEL#${channelId}`,
      ":sk": "MSG#",
    },
    Limit: limit,
    ScanIndexForward: true, // oldest first
  };

  if (lastKey) {
    params.ExclusiveStartKey = JSON.parse(lastKey);
  }

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items as Message[]) || [];
}

export async function updateMessage(
  channelId: string,
  messageId: string,
  timestamp: string,
  content: string
): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `CHANNEL#${channelId}`,
      SK: `MSG#${timestamp}#${messageId}`,
    },
    UpdateExpression: "SET content = :content, updatedAt = :updatedAt",
    ExpressionAttributeValues: {
      ":content": content,
      ":updatedAt": new Date().toISOString(),
    },
  };

  await docClient.send(new UpdateCommand(params));
}

export async function deleteMessage(
  channelId: string,
  messageId: string,
  timestamp: string
): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `CHANNEL#${channelId}`,
      SK: `MSG#${timestamp}#${messageId}`,
    },
  };

  await docClient.send(new DeleteCommand(params));
}

// ==================== REACTION OPERATIONS ====================

export async function addReaction(
  channelId: string,
  messageId: string,
  timestamp: string,
  emoji: string,
  userId: string
): Promise<void> {
  // First get the current message to update reactions
  const getParams = {
    TableName: TABLE_NAME,
    Key: {
      PK: `CHANNEL#${channelId}`,
      SK: `MSG#${timestamp}#${messageId}`,
    },
  };

  const result = await docClient.send(new GetCommand(getParams));
  const message = result.Item as Message;

  if (!message) return;

  const reactions = message.reactions || [];
  const existingReaction = reactions.find((r) => r.emoji === emoji);

  if (existingReaction) {
    if (!existingReaction.users.includes(userId)) {
      existingReaction.users.push(userId);
    }
  } else {
    reactions.push({ emoji, users: [userId] });
  }

  const updateParams = {
    TableName: TABLE_NAME,
    Key: {
      PK: `CHANNEL#${channelId}`,
      SK: `MSG#${timestamp}#${messageId}`,
    },
    UpdateExpression: "SET reactions = :reactions",
    ExpressionAttributeValues: {
      ":reactions": reactions,
    },
  };

  await docClient.send(new UpdateCommand(updateParams));
}

// ==================== USER OPERATIONS ====================

export interface UserProfile {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export async function createUserProfile(profile: UserProfile): Promise<void> {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      PK: `USER#${profile.userId}`,
      SK: "PROFILE",
      ...profile,
      createdAt: profile.createdAt || new Date().toISOString(),
    },
  };

  await docClient.send(new PutCommand(params));
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      PK: `USER#${userId}`,
      SK: "PROFILE",
    },
  };

  const result = await docClient.send(new GetCommand(params));
  return result.Item as UserProfile | null;
}

