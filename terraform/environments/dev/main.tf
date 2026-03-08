terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # backend "gcs" {
  #   bucket = "gcp-tutorial-488405-terraform-state"
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
    "secretmanager.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# --------------------------------------------------
# IAM
# --------------------------------------------------
module "iam" {
  source = "../../modules/iam"

  project_id           = var.project_id
  cloud_run_sa_name    = "gcp-tutorial-run-dev"
  cloud_build_sa_email = "${var.project_number}-compute@developer.gserviceaccount.com"

  depends_on = [google_project_service.apis]
}

# --------------------------------------------------
# Secret Manager
# --------------------------------------------------
module "secret_manager" {
  source = "../../modules/secret_manager"

  region     = var.region
  secret_ids = ["db-password-dev"]
  secret_data = {
    db-password-dev = var.db_password
  }

  depends_on = [google_project_service.apis]
}

# --------------------------------------------------
# Artifact Registry
# --------------------------------------------------
module "artifact_registry" {
  source = "../../modules/artifact_registry"

  repository_id = "gcp-tutorial"
  region        = var.region
  description   = "Docker images for gcp-tutorial (dev)"

  depends_on = [google_project_service.apis]
}

# --------------------------------------------------
# Cloud SQL
# --------------------------------------------------
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

# --------------------------------------------------
# Cloud Run
# --------------------------------------------------
module "cloud_run" {
  source = "../../modules/cloud_run"

  service_name          = "${var.service_name}-dev"
  region                = var.region
  min_instances         = 0
  max_instances         = 1
  cpu                   = "1"
  memory                = "128Mi"
  allow_unauthenticated = true
  service_account_email = module.iam.cloud_run_sa_email

  cloud_sql_connection_name = module.cloud_sql.connection_name

  env_vars = {
    DB_HOST     = "/cloudsql/${module.cloud_sql.connection_name}"
    DB_NAME     = module.cloud_sql.database_name
    DB_USER     = "app"
    BUCKET_NAME = module.cloud_storage.bucket_name
  }

  secret_env_vars = {
    DB_PASSWORD = "db-password-dev"
  }

  depends_on = [
    google_project_service.apis,
    module.iam,
    module.secret_manager,
  ]
}

# --------------------------------------------------
# Cloud Build
# --------------------------------------------------
module "cloud_build" {
  source = "../../modules/cloud_build"

  trigger_name        = "gcp-tutorial-deploy-dev"
  region              = var.region
  repository_resource = "projects/${var.project_id}/locations/${var.region}/connections/gcp-tutorial/repositories/Nagomu0128-gcp-tutorial"
  branch_pattern      = "^main$"
  service_account     = "projects/${var.project_id}/serviceAccounts/${var.project_number}-compute@developer.gserviceaccount.com"

  substitutions = {
    _REGION  = var.region
    _SERVICE = "${var.service_name}-dev"
  }

  depends_on = [
    google_project_service.apis,
    module.iam,
  ]
}

# --------------------------------------------------
# Cloud Storage
# --------------------------------------------------
module "cloud_storage" {
  source = "../../modules/cloud_storage"

  bucket_name   = "${var.project_id}-gcp-tutorial-assets-dev"
  region        = var.region
  force_destroy = true

  depends_on = [google_project_service.apis]
}
