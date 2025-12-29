output "s3_bucket_name" {
  description = "Name of the S3 bucket for exam papers"
  value       = aws_s3_bucket.exam_papers.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.exam_papers.arn
}

output "iam_policy_arn" {
  description = "ARN of the IAM policy for S3 access"
  value       = aws_iam_policy.s3_exam_papers_access.arn
}

output "environment_variable" {
  description = "Environment variable to add to .env.local"
  value       = "S3_EXAM_PAPERS_BUCKET=${aws_s3_bucket.exam_papers.bucket}"
}
