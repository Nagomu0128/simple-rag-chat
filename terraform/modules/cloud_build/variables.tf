variable "trigger_name" {
  type = string
}

variable "region" {
  type = string
}

variable "github_owner" {
  type = string
}

variable "github_repo" {
  type = string
}

variable "branch_pattern" {
  type    = string
  default = "^main$"
}

variable "cloudbuild_file" {
  type    = string
  default = "cloudbuild.yaml"
}

variable "substitutions" {
  type    = map(string)
  default = {}
}
