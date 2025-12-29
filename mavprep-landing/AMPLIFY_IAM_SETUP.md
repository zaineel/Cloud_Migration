# AWS Amplify IAM Role Setup

## Problem
AWS Amplify doesn't allow environment variables starting with `AWS_` for security reasons.

## Solution
Use an IAM service role that gives Amplify permission to access DynamoDB directly.

---

## Step 1: Create IAM Policy for DynamoDB Access

1. **Go to IAM Console:**
   - https://console.aws.amazon.com/iam/

2. **Create Policy:**
   - Click **Policies** → **Create policy**
   - Choose **JSON** tab
   - Paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/MavPrepData",
        "arn:aws:dynamodb:us-east-1:*:table/MavPrepData/index/*"
      ]
    }
  ]
}
```

3. **Name the policy:**
   - Name: `MavPrepDynamoDBAccess`
   - Description: `Allows MavPrep to access DynamoDB table`
   - Click **Create policy**

---

## Step 2: Create IAM Role for Amplify

1. **Create Role:**
   - Go to **Roles** → **Create role**
   - **Trusted entity type:** AWS service
   - **Use case:** Amplify - Backend Deployment
   - Click **Next**

2. **Attach Policies:**
   - Search for: `MavPrepDynamoDBAccess`
   - Check the box next to it
   - Also search and attach: `AdministratorAccess-Amplify` (AWS managed policy)
   - Click **Next**

3. **Name the Role:**
   - Role name: `AmplifyMavPrepRole`
   - Description: `Service role for MavPrep Amplify app`
   - Click **Create role**

---

## Step 3: Attach Role to Amplify App

1. **Go to Amplify Console:**
   - Open your MavPrep app

2. **Update Service Role:**
   - Click **App settings** → **General**
   - Scroll to **Service role**
   - Click **Edit**
   - Select: `AmplifyMavPrepRole`
   - Click **Save**

---

## Step 4: Update Code to Use IAM Role

The DynamoDB client will automatically use the Amplify service role credentials when deployed.

**Update `/Users/zaineelmithani/fall_25/ACM-projects/Cloud_Migration/mavprep-landing/lib/dynamodb.ts`:**

```typescript
const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  // Credentials will be automatically provided by IAM role in production
  // Only use explicit credentials in development
  ...(process.env.NODE_ENV === 'development' && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    }
  })
});
```

---

## Step 5: Environment Variables for Amplify

Now you only need these environment variables (no AWS credentials):

```
NEXT_PUBLIC_COGNITO_USER_POOL_ID = us-east-1_Kl5wGaCms
NEXT_PUBLIC_COGNITO_CLIENT_ID = 9ku8gqluh7409ba3k5nmmrgg2
NEXT_PUBLIC_AWS_REGION = us-east-1
DYNAMODB_TABLE_NAME = MavPrepData
NEXT_PUBLIC_SOCKET_URL = http://localhost:3000
```

**After first deployment, add:**
```
NEXT_PUBLIC_APP_URL = https://main.XXXXXXX.amplifyapp.com
```

---

## Step 6: Keep Local Development Working

For local development, keep your `.env.local` file with AWS credentials:

```
# Local development only - not needed in Amplify
MAVPREP_AWS_REGION=us-east-1
MAVPREP_AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
MAVPREP_AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Verification

After deploying:
1. Check Amplify build logs - should succeed
2. Test creating a channel - should work
3. Check CloudWatch logs for any permission errors

If you see "Access Denied" errors:
- Verify the IAM role is attached
- Check the DynamoDB policy has correct table ARN
- Ensure the table name in environment variables matches

---

## Security Benefits

✅ No hardcoded credentials in environment variables
✅ Automatic credential rotation
✅ Fine-grained permissions (only DynamoDB access)
✅ Better security posture
✅ Follows AWS best practices
