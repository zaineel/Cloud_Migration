# MavPrep Infrastructure as Code (Terraform)

This directory contains Terraform configuration for MavPrep's AWS infrastructure.

## What This Creates

- **S3 Bucket**: `mavprep-exam-papers-prod` for storing exam paper PDFs
- **S3 Bucket Configuration**:
  - Public access blocked (private bucket)
  - Versioning enabled
  - CORS configured for localhost and Amplify domain
- **IAM Policy**: `MavPrepS3ExamPapersAccess` with S3 permissions
- **IAM Policy Attachment**: Attaches policy to your existing IAM user

## Prerequisites

1. **Install Terraform**:
   ```bash
   brew install terraform  # macOS
   # or download from: https://www.terraform.io/downloads
   ```

2. **AWS Credentials**:
   You already have these in your `.env.local`:
   - Access Key ID: `AKIAUEWF4W3UJJUYXX3Y`
   - Secret Access Key: (from `MAVPREP_AWS_SECRET_ACCESS_KEY`)

3. **Configure AWS CLI** (if not already done):
   ```bash
   aws configure
   # Enter your access key ID and secret access key when prompted
   # Region: us-east-1
   # Output format: json
   ```

## How to Use

### Step 1: Initialize Terraform

```bash
cd terraform
terraform init
```

This downloads the AWS provider and sets up Terraform.

### Step 2: Review the Plan

```bash
terraform plan
```

This shows what Terraform will create without actually creating it.

**IMPORTANT**: If you want to attach the S3 policy to your existing IAM user, you need to provide the IAM username. Find it by running:

```bash
aws iam list-users
```

Look for the user with access key `AKIAUEWF4W3UJJUYXX3Y` and note the username.

### Step 3: Apply the Configuration

**Option A: Without attaching to IAM user** (you'll manually attach later):
```bash
terraform apply
```

**Option B: Attach to existing IAM user** (replace `YOUR_IAM_USERNAME`):
```bash
terraform apply -var="iam_user_name=YOUR_IAM_USERNAME"
```

Type `yes` when prompted to confirm.

### Step 4: Get Outputs

After applying, Terraform will show outputs including:
- S3 bucket name
- IAM policy ARN
- Environment variable to add to `.env.local`

You can also view outputs later:
```bash
terraform output
```

### Step 5: Update Environment Variables

Copy the `S3_EXAM_PAPERS_BUCKET` value to your `.env.local` file:
```bash
S3_EXAM_PAPERS_BUCKET=mavprep-exam-papers-prod
```

## Customization

You can customize values by creating a `terraform.tfvars` file:

```hcl
# terraform.tfvars
aws_region   = "us-east-1"
environment  = "prod"
bucket_name  = "mavprep-exam-papers-prod"
iam_user_name = "your-iam-username"

allowed_origins = [
  "http://localhost:3000",
  "https://main.d1tuwgozwz7swd.amplifyapp.com"
]
```

Or pass variables on the command line:
```bash
terraform apply -var="bucket_name=my-custom-bucket-name"
```

## Managing State

Terraform creates a `terraform.tfstate` file to track resources.

**IMPORTANT**: Add this to `.gitignore`:
```bash
echo "terraform/.terraform/" >> ../.gitignore
echo "terraform/*.tfstate" >> ../.gitignore
echo "terraform/*.tfstate.backup" >> ../.gitignore
echo "terraform/.terraform.lock.hcl" >> ../.gitignore
```

For production, you should use **remote state** (S3 backend), but for now local state is fine.

## Destroying Resources

If you need to delete all infrastructure:
```bash
terraform destroy
```

**WARNING**: This will delete the S3 bucket and all exam papers inside it!

## Troubleshooting

### Error: "AccessDenied" or "UnauthorizedOperation"

Your AWS credentials don't have sufficient permissions. Make sure:
1. You're using the correct access key with IAM permissions
2. The IAM user has permissions to create S3 buckets and IAM policies

### Error: "BucketAlreadyExists"

The bucket name is globally unique. If someone else has this name, change it:
```bash
terraform apply -var="bucket_name=mavprep-exam-papers-prod-unique123"
```

### IAM User Not Found

If you get an error about IAM user not found:
1. Run `aws iam list-users` to find your username
2. Use that username: `terraform apply -var="iam_user_name=actual-username"`

Or skip attaching to IAM user and manually attach the policy later in AWS Console.

## Next Steps

After running Terraform:
1. ✅ S3 bucket created
2. ✅ CORS configured
3. ✅ IAM policy created
4. Update `.env.local` with `S3_EXAM_PAPERS_BUCKET`
5. Continue with backend implementation (lib/s3.ts, API routes)

## File Structure

```
terraform/
├── main.tf          # Main resources (S3, IAM)
├── variables.tf     # Input variables
├── outputs.tf       # Output values
├── README.md        # This file
└── terraform.tfstate # State file (auto-generated, in .gitignore)
```

## Resources Created

| Resource | Type | Purpose |
|----------|------|---------|
| `aws_s3_bucket.exam_papers` | S3 Bucket | Store exam PDFs |
| `aws_s3_bucket_public_access_block.exam_papers` | S3 Config | Block public access |
| `aws_s3_bucket_versioning.exam_papers` | S3 Config | Enable versioning |
| `aws_s3_bucket_cors_configuration.exam_papers` | S3 Config | Allow web uploads |
| `aws_iam_policy.s3_exam_papers_access` | IAM Policy | S3 permissions |
| `aws_iam_user_policy_attachment.s3_exam_papers_attachment` | IAM Attachment | Attach policy to user |
