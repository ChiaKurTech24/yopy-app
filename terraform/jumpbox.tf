# Jumpbox Subnet
resource "azurerm_subnet" "jumpbox" {
  name                 = "jumpbox-subnet"
  resource_group_name  = azurerm_resource_group.yopy.name
  virtual_network_name = azurerm_virtual_network.yopy.name
  address_prefixes     = ["10.0.2.0/24"]
}

# Network Security Group for Jumpbox
resource "azurerm_network_security_group" "jumpbox" {
  name                = "jumpbox-nsg"
  location            = var.location
  resource_group_name = azurerm_resource_group.yopy.name

  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

# Public IP for Jumpbox
resource "azurerm_public_ip" "jumpbox" {
  name                = "jumpbox-pip"
  location            = var.location
  resource_group_name = azurerm_resource_group.yopy.name
  allocation_method   = "Dynamic"
  tags                = var.tags
}

# Network Interface for Jumpbox
resource "azurerm_network_interface" "jumpbox" {
  name                = "jumpbox-nic"
  location            = var.location
  resource_group_name = azurerm_resource_group.yopy.name

  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.jumpbox.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.jumpbox.id
  }
}

# Associate NSG with NIC
resource "azurerm_network_interface_security_group_association" "jumpbox" {
  network_interface_id      = azurerm_network_interface.jumpbox.id
  network_security_group_id = azurerm_network_security_group.jumpbox.id
}

# Jumpbox VM
resource "azurerm_linux_virtual_machine" "jumpbox" {
  name                = "yopy-jumpbox"
  resource_group_name = azurerm_resource_group.yopy.name
  location            = var.location
  size                = "Standard_B2s"  # 2 vCPUs, 4 GiB memory
  admin_username      = "adminuser"
  tags                = var.tags

  network_interface_ids = [
    azurerm_network_interface.jumpbox.id
  ]

  admin_ssh_key {
    username   = "adminuser"
    public_key = file("~/.ssh/id_rsa.pub")  # Make sure to have your SSH key ready
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  # Disable password authentication
  disable_password_authentication = true

  # Install required tools
  custom_data = base64encode(<<-EOF
    #!/bin/bash
    apt-get update
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    # Install Azure CLI
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
    # Install kubectl
    curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
    echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | tee -a /etc/apt/sources.list.d/kubernetes.list
    apt-get update
    apt-get install -y kubectl
    # Install Helm
    curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
    chmod 700 get_helm.sh
    ./get_helm.sh
  EOF
  )
}

# Output the jumpbox public IP
output "jumpbox_public_ip" {
  value = azurerm_public_ip.jumpbox.ip_address
  description = "Public IP address of the jumpbox"
}

output "jumpbox_username" {
  value = "adminuser"
  description = "Username for the jumpbox"
} 