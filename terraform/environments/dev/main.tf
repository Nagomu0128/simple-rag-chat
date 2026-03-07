terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # backend "gcs" {
  #   bucket = "your-project-id-terraform-state"
  #   prefix = "env/dev"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# --------------------------------------------------
# API 有効化
# --------------------------------------------------
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# --------------------------------------------------
# Modules
# --------------------------------------------------
module "artifact_registry" {
  source = "../../modules/artifact_registry"

  repository_id = "gcp-tutorial"
  region        = var.region
  description   = "Docker images for gcp-tutorial (dev)"

  depends_on = [google_project_service.apis]
}

module "cloud_run" {
  source = "../../modules/cloud_run"

  service_name          = "${var.service_name}-dev"
  region                = var.region
  min_instances         = 0
  max_instances         = 2
  cpu                   = "1"
  memory                = "512Mi"
  allow_unauthenticated = true

  depends_on = [google_project_service.apis]
}

module "cloud_build" {
  source = "../../modules/cloud_build"

  trigger_name   = "gcp-tutorial-deploy-dev"
  region         = var.region
  github_owner   = var.github_owner
  github_repo    = var.github_repo
  branch_pattern = "^develop$"

  substitutions = {
    _REGION  = var.region
    _SERVICE = "${var.service_name}-dev"
  }

  depends_on = [google_project_service.apis]
}

module "cloud_sql" {
  source = "../../modules/cloud_sql"

  instance_name       = "gcp-tutorial-db-dev"
  region              = var.region
  tier                = "db-f1-micro"
  deletion_protection = false
  backup_enabled      = false
  db_password         = var.db_password

  depends_on = [google_project_service.apis]
}

module "cloud_storage" {
  source = "../../modules/cloud_storage"

  bucket_name   = "${var.project_id}-gcp-tutorial-assets-dev"
  region        = var.region
  force_destroy = true

  depends_on = [google_project_service.apis]
}
