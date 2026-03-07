variable "instance_name" {
  type = string
}

variable "region" {
  type = string
}

variable "database_version" {
  type    = string
  default = "POSTGRES_15"
}

variable "tier" {
  type    = string
  default = "db-f1-micro"
}

variable "availability_type" {
  type    = string
  default = "ZONAL"
}

variable "backup_enabled" {
  type    = bool
  default = false
}

variable "deletion_protection" {
  type    = bool
  default = false
}

variable "database_name" {
  type    = string
  default = "app"
}

variable "db_user" {
  type    = string
  default = "app"
}

variable "db_password" {
  type      = string
  sensitive = true
}
