terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for Exam Papers
resource "aws_s3_bucket" "exam_papers" {
  bucket = var.bucket_name

  tags = {
    Name        = "MavPrep Exam Papers"
    Environment = var.environment
    Project     = "MavPrep"
  }
}

# Block all public access to the bucket
resource "aws_s3_bucket_public_access_block" "exam_papers" {
  bucket = aws_s3_bucket.exam_papers.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning (optional but recommended)
resource "aws_s3_bucket_versioning" "exam_papers" {
  bucket = aws_s3_bucket.exam_papers.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Configure CORS for web uploads
resource "aws_s3_bucket_cors_configuration" "exam_papers" {
  bucket = aws_s3_bucket.exam_papers.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# IAM Policy for S3 Access
resource "aws_iam_policy" "s3_exam_papers_access" {
  name        = "MavPrepS3ExamPapersAccess"
  description = "Allow access to MavPrep exam papers S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.exam_papers.arn,
          "${aws_s3_bucket.exam_papers.arn}/*"
        ]
      }
    ]
  })
}

# Attach policy to existing IAM user (if user_name is provided)
resource "aws_iam_user_policy_attachment" "s3_exam_papers_attachment" {
  count      = var.iam_user_name != "" ? 1 : 0
  user       = var.iam_user_name
  policy_arn = aws_iam_policy.s3_exam_papers_access.arn
}
