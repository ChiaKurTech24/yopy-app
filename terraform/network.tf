# Virtual Network
resource "azurerm_virtual_network" "yopy" {
  name                = "yopy-vnet"
  location            = var.location
  resource_group_name = azurerm_resource_group.yopy.name
  address_space       = ["10.0.0.0/22"]  # 1024 IPs
  tags                = var.tags
}

# AKS Subnet
resource "azurerm_subnet" "aks" {
  name                 = "aks-subnet"
  resource_group_name  = azurerm_resource_group.yopy.name
  virtual_network_name = azurerm_virtual_network.yopy.name
  address_prefixes     = ["10.0.0.0/24"]  # 256 IPs
} 