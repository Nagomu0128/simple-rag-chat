resource "google_storage_bucket" "this" {
  name          = var.bucket_name
  location      = var.region
  force_destroy = var.force_destroy

  uniform_bucket_level_access = true
}
