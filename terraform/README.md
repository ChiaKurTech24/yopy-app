# Yopy Application - Azure Infrastructure

This Terraform configuration sets up the Azure infrastructure for the Yopy messaging application.

## Prerequisites

1. Azure CLI installed and configured
2. Terraform installed
3. Azure subscription with sufficient permissions
4. SSH key pair for jumpbox access

## Configuration

The infrastructure includes:
- Resource Group
- Virtual Network and Subnet
- AKS Cluster with:
  - 1 node (Standard_D2s_v3)
  - Azure CNI networking
  - System-assigned managed identity
- Jumpbox VM with:
  - Azure CLI
  - kubectl
  - Helm
- Storage Account for Terraform state

## Usage

1. Initialize Terraform with Azure Storage Account backend:
```bash
terraform init -backend-config="storage_account_name=yopystate" \
               -backend-config="container_name=tfstate" \
               -backend-config="key=terraform.tfstate" \
               -backend-config="resource_group_name=yopy-rg"
```

2. Review the planned changes:
```bash
terraform plan
```

3. Apply the configuration:
```bash
terraform apply
```

4. After deployment, you can deploy the Kubernetes manifests:
```bash
# SSH into the jumpbox
ssh adminuser@<jumpbox-public-ip>

# Get AKS credentials
az aks get-credentials --resource-group yopy-rg --name yopy-aks

# Deploy Kubernetes manifests
kubectl apply -f ../k8s-manifest/
```

5. To destroy the infrastructure:
```bash
terraform destroy
```

## Important Notes

- This configuration is optimized for a lab environment
- The AKS cluster uses a single node to minimize costs
- All resources are tagged with "Environment: Lab" and "Project: Yopy"
- Remember to destroy the infrastructure when you're done to avoid unnecessary charges
- The Terraform state is stored in Azure Storage Account for persistence and team collaboration

## Cost Estimation

For a 6-hour lab session:
- AKS Node: ~$0.576
- Network: ~$0.15
- Jumpbox: ~$0.13
- Storage Account: ~$0.02
- Total: ~$0.88 - $1.00 USD

## Cleanup

To ensure you don't incur unnecessary charges:
1. Delete the Kubernetes resources:
```bash
kubectl delete -f ../k8s-manifest/
```

2. Destroy the Azure infrastructure:
```bash
terraform destroy
```

3. The storage account will be deleted with the resource group 