output "cloud_run_url" {
  value = module.cloud_run.service_url
}

output "artifact_registry_url" {
  value = module.artifact_registry.repository_url
}

output "cloud_sql_connection_name" {
  value = module.cloud_sql.connection_name
}

output "storage_bucket_name" {
  value = module.cloud_storage.bucket_name
}
