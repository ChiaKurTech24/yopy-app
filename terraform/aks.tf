# AKS Cluster
resource "azurerm_kubernetes_cluster" "yopy" {
  name                = "yopy-aks"
  location            = var.location
  resource_group_name = azurerm_resource_group.yopy.name
  dns_prefix          = var.dns_prefix
  sku_tier            = "Free"

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.node_vm_size
    vnet_subnet_id = azurerm_subnet.aks.id
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin = "azure"
    network_policy = "azure"
    service_cidr   = "10.0.3.0/24"
    dns_service_ip = "10.0.3.10"
  }

  tags = var.tags
}

# Role assignments for AKS managed identity
resource "azurerm_role_assignment" "aks_network_contributor" {
  scope                = azurerm_resource_group.yopy.id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.yopy.identity[0].principal_id
}

resource "azurerm_role_assignment" "aks_public_ip_contributor" {
  scope                = azurerm_resource_group.yopy.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_kubernetes_cluster.yopy.identity[0].principal_id
}

# Get AKS credentials
resource "null_resource" "get_credentials" {
  depends_on = [azurerm_kubernetes_cluster.yopy]
  
  provisioner "local-exec" {
    command = "az aks get-credentials --resource-group ${azurerm_resource_group.yopy.name} --name ${azurerm_kubernetes_cluster.yopy.name} --overwrite-existing"
  }
} 