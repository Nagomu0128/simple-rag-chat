variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
}

variable "region" {
  type    = string
  default = "asia-northeast2"
}

variable "service_name" {
  type    = string
  default = "gcp-tutorial-service"
}

variable "github_owner" {
  type = string
}

variable "github_repo" {
  type    = string
  default = "gcp-tutorial"
}

variable "db_password" {
  type      = string
  sensitive = true
}
