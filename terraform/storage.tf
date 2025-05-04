# Storage Account for Terraform State
resource "azurerm_storage_account" "tfstate" {
  name                     = "yopystate"
  resource_group_name      = azurerm_resource_group.yopy.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  # Enable blob public access for state management
  allow_nested_items_to_be_public = false

  tags = var.tags
}

# Storage Container for Terraform State
resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate.name
  container_access_type = "private"
} 