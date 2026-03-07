resource "google_cloudbuild_trigger" "this" {
  name     = var.trigger_name
  location = var.region

  github {
    owner = var.github_owner
    name  = var.github_repo

    push {
      branch = var.branch_pattern
    }
  }

  filename = var.cloudbuild_file

  substitutions = var.substitutions
}
