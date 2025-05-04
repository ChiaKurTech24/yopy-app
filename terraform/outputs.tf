output "resource_group_name" {
  value = azurerm_resource_group.yopy.name
}

output "cluster_name" {
  value = azurerm_kubernetes_cluster.yopy.name
}

output "kube_config" {
  value     = azurerm_kubernetes_cluster.yopy.kube_config_raw
  sensitive = true
}

output "host" {
  value     = azurerm_kubernetes_cluster.yopy.kube_config.0.host
  sensitive = true
} 