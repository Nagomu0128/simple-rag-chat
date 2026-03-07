resource "google_artifact_registry_repository" "docker" {
  repository_id = var.repository_id
  location      = var.region
  format        = "DOCKER"
  description   = var.description
}
