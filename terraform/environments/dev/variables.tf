variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
}

variable "project_number" {
  description = "GCP プロジェクト番号"
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

variable "db_password" {
  type      = string
  sensitive = true
}

variable "gemini_api_key" {
  type      = string
  sensitive = true
}

variable "firebase_api_key" {
  type = string
}

variable "firebase_app_id" {
  type = string
}
