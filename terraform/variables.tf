variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (e.g., prod, dev)"
  type        = string
  default     = "prod"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for exam papers"
  type        = string
  default     = "mavprep-exam-papers-prod"
}

variable "allowed_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "https://main.d1tuwgozwz7swd.amplifyapp.com"
  ]
}

variable "iam_user_name" {
  description = "Name of IAM user to attach S3 policy to (leave empty to skip)"
  type        = string
  default     = ""
}
