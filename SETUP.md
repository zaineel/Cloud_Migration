# MavPrep Setup Guide

Complete guide for setting up MavPrep locally and in production.

---

## 📁 Project Structure

```
Cloud_Migration/
├── mavprep-landing/           # Main Next.js application
│   ├── app/
│   │   ├── exams/             # Exam papers repository
│   │   ├── home/              # Dashboard with channels & voice
│   │   ├── login/             # Authentication pages
│   │   ├── settings/          # User profile settings
│   │   ├── layout.tsx         # Root layout with providers
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── AuthGuard.tsx      # Route protection
│   ├── lib/
│   │   ├── amplify-provider.tsx  # AWS Amplify configuration
│   │   ├── dynamodb.ts           # DynamoDB client & operations
│   │   └── s3.ts                 # S3 client for exam papers
│   ├── pages/api/
│   │   ├── webrtc-signaling.ts   # Socket.IO server
│   │   ├── channels/             # Channel CRUD endpoints
│   │   ├── messages/             # Message CRUD endpoints
│   │   ├── exam-papers/          # Exam papers endpoints
│   │   ├── check-username.ts     # Username availability
│   │   ├── get-user-profile.ts   # User profile retrieval
│   │   └── update-profile.ts     # Profile updates
│   ├── public/                # Static assets
│   ├── .env.local             # Local environment variables
│   ├── .env.example           # Example environment file
│   ├── package.json           # Dependencies
│   └── tsconfig.json          # TypeScript config
├── terraform/                 # Infrastructure as Code
│   ├── main.tf                # S3 bucket configuration
│   ├── variables.tf           # Terraform variables
│   └── outputs.tf             # Terraform outputs
└── docs/                      # Documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites

- **Node.js** 18+ and npm
- **Git**
- **AWS Account** with:
  - Cognito User Pool
  - DynamoDB Table
  - S3 Bucket
  - IAM User with credentials

### 2. Clone Repository

```bash
git clone https://github.com/zaineel/Cloud_Migration.git
cd Cloud_Migration/mavprep-landing
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# AWS Cognito (Client-side - exposed to browser)
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AWS DynamoDB & S3 (Server-side - never exposed)
MAVPREP_AWS_REGION=us-east-1
MAVPREP_AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
MAVPREP_AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=MavPrepData
S3_EXAM_PAPERS_BUCKET=mavprep-exam-papers-prod
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ AWS Infrastructure Setup

### AWS Cognito User Pool

1. Go to [AWS Cognito Console](https://console.aws.amazon.com/cognito)
2. **Create User Pool**:
   - **Sign-in options**: Email
   - **Password policy**: Minimum 8 characters
   - **MFA**: Optional (recommended: OFF for development)
   - **User account recovery**: Email only
   - **Self-registration**: Enabled
   - **Required attributes**: `email`, `preferred_username`
   - **Email verification**: Required

3. **Create App Client**:
   - **App type**: Public client
   - **Client secret**: Don't generate
   - **Auth flows**: ALLOW_USER_PASSWORD_AUTH, ALLOW_REFRESH_TOKEN_AUTH

4. Copy **User Pool ID** and **App Client ID** to `.env.local`

### AWS DynamoDB Table

#### Table Design

```
Table Name: MavPrepData
Partition Key: PK (String)
Sort Key: SK (String)
Global Secondary Index: GSI1
  - GSI1PK (String)
  - GSI1SK (String)
```

#### Create Table via AWS CLI

```bash
aws dynamodb create-table \
  --table-name MavPrepData \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    '[{
      "IndexName": "GSI1",
      "KeySchema": [
        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
        {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"},
      "ProvisionedThroughput": {"ReadCapacityUnits": 5, "WriteCapacityUnits": 5}
    }]' \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

#### Data Access Patterns

| Entity Type | PK Pattern | SK Pattern | Description |
|-------------|-----------|------------|-------------|
| **Channel** | `CHANNEL#{id}` | `METADATA` | Channel info |
| **Message** | `CHANNEL#{channelId}` | `MSG#{timestamp}#{id}` | Chat messages |
| **User Profile** | `USER#{userId}` | `PROFILE` | User data |
| **Username** | `USERNAME#{username}` | `METADATA` | Username reservation |
| **Exam Paper** | `EXAMPAPER#{paperId}` | `METADATA` | Exam paper metadata |

### AWS S3 Bucket (for Exam Papers)

#### Option 1: Using Terraform (Recommended)

```bash
cd terraform
terraform init
terraform apply
```

#### Option 2: Using AWS CLI

```bash
# Create bucket
aws s3api create-bucket \
  --bucket mavprep-exam-papers-prod \
  --region us-east-1

# Block public access
aws s3api put-public-access-block \
  --bucket mavprep-exam-papers-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket mavprep-exam-papers-prod \
  --versioning-configuration Status=Enabled

# Configure CORS
aws s3api put-bucket-cors \
  --bucket mavprep-exam-papers-prod \
  --cors-configuration file://terraform/cors-config.json
```

**CORS Configuration** (`terraform/cors-config.json`):
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "https://main.d1tuwgozwz7swd.amplifyapp.com"
      ],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### IAM User Permissions

Create an IAM user with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
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
        "arn:aws:dynamodb:*:*:table/MavPrepData",
        "arn:aws:dynamodb:*:*:table/MavPrepData/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::mavprep-exam-papers-prod",
        "arn:aws:s3:::mavprep-exam-papers-prod/*"
      ]
    }
  ]
}
```

Generate access keys and add to `.env.local`:
- `MAVPREP_AWS_ACCESS_KEY_ID`
- `MAVPREP_AWS_SECRET_ACCESS_KEY`

---

## 🚢 Production Deployment (AWS Amplify)

### 1. Connect Repository to Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Click **New app** → **Host web app**
3. Connect your **GitHub** repository
4. Select the **main** branch

### 2. Configure Build Settings

Amplify should auto-detect the `amplify.yml` file. If not, use this configuration:

```yaml
version: 1
applications:
  - appRoot: mavprep-landing
    frontend:
      phases:
        preBuild:
          commands:
            - npm ci
        build:
          commands:
            - npm run build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - node_modules/**/*
          - .next/cache/**/*
```

### 3. Add Environment Variables

In Amplify Console → **App settings** → **Environment variables**, add:

```
NEXT_PUBLIC_COGNITO_USER_POOL_ID = us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID = xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_AWS_REGION = us-east-1
MAVPREP_AWS_REGION = us-east-1
MAVPREP_AWS_ACCESS_KEY_ID = AKIAXXXXXXXXXXXXXXXX
MAVPREP_AWS_SECRET_ACCESS_KEY = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME = MavPrepData
S3_EXAM_PAPERS_BUCKET = mavprep-exam-papers-prod
NEXT_PUBLIC_SOCKET_URL = http://localhost:3000
```

**After first deployment**, add:
```
NEXT_PUBLIC_APP_URL = https://main.xxxxxxxxxxxxxx.amplifyapp.com
```

### 4. Deploy

Click **Save and deploy**. Amplify will:
1. Clone your repository
2. Install dependencies
3. Build the Next.js app
4. Deploy to CloudFront CDN

---

## 🔧 Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🧪 Testing

### Test Authentication
1. Go to `/login`
2. Sign up with a valid email
3. Check email for verification code
4. Verify and sign in

### Test Text Channels
1. Navigate to `/home`
2. Create a new text channel
3. Send messages
4. Test replies, edits, reactions

### Test Voice/Video
1. Join a voice channel
2. Test mute/unmute
3. Toggle camera on/off
4. Open in two browser windows to test peer connections

### Test Exam Papers
1. Go to `/exams`
2. Upload a PDF (max 10MB)
3. Filter by course/semester
4. Download the PDF

---

## 🐛 Troubleshooting

### "Authentication not configured"
- Check `.env.local` has correct Cognito values
- Ensure `NEXT_PUBLIC_` prefix for client-side vars
- Restart dev server after changing env vars

### "Failed to load exam papers"
- Verify `S3_EXAM_PAPERS_BUCKET` is set in Amplify environment variables
- Check IAM user has S3 permissions
- Verify S3 bucket exists and CORS is configured

### WebRTC not connecting
- Check both users are in the same voice channel
- Verify Socket.IO server is running
- Check browser console for errors
- Try using TURN server if behind firewall

### DynamoDB errors
- Verify table `MavPrepData` exists
- Check GSI1 index is created
- Ensure IAM permissions are correct
- Verify AWS credentials in `.env.local`

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [AWS Amplify Docs](https://docs.amplify.aws/)
- [AWS Cognito Guide](https://docs.aws.amazon.com/cognito/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [WebRTC Documentation](https://webrtc.org/getting-started/overview)

---

**Need help?** Open an [issue](https://github.com/zaineel/Cloud_Migration/issues) or ask in Discord!
