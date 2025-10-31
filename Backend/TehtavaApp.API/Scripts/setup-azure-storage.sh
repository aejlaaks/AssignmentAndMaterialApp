#!/bin/bash

# Script to set up Azure Blob Storage for TehtavaApp
# Prerequisites: Azure CLI installed and logged in (az login)

# Configuration - CHANGE THESE VALUES
RESOURCE_GROUP="tehtavaapp-rg"
STORAGE_ACCOUNT_NAME="tehtavaappstorage"
LOCATION="northeurope"
CONTAINER_NAME="uploads"
SKU="Standard_LRS"  # Options: Standard_LRS, Standard_GRS, Standard_RAGRS, etc.

# ANSI colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}TehtavaApp Azure Storage Setup Tool${NC}"
echo "---------------------------------------------"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}Azure CLI not found. Please install it first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli${NC}"
    exit 1
fi

# Check if logged in to Azure
echo -e "${BLUE}Checking Azure login...${NC}"
ACCOUNT=$(az account show --query name -o tsv 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Not logged in to Azure. Please log in:${NC}"
    az login
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to log in to Azure.${NC}"
        exit 1
    fi
    ACCOUNT=$(az account show --query name -o tsv)
fi
echo -e "${GREEN}Logged in to Azure as: ${ACCOUNT}${NC}"

# Create resource group if it doesn't exist
echo -e "${BLUE}Checking resource group...${NC}"
if ! az group show --name "$RESOURCE_GROUP" &>/dev/null; then
    echo -e "${YELLOW}Resource group doesn't exist. Creating...${NC}"
    az group create --name "$RESOURCE_GROUP" --location "$LOCATION"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create resource group.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Resource group created.${NC}"
else
    echo -e "${GREEN}Resource group exists.${NC}"
fi

# Create storage account if it doesn't exist
echo -e "${BLUE}Checking storage account...${NC}"
if ! az storage account show --name "$STORAGE_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    echo -e "${YELLOW}Storage account doesn't exist. Creating...${NC}"
    az storage account create \
        --name "$STORAGE_ACCOUNT_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$LOCATION" \
        --sku "$SKU" \
        --kind StorageV2 \
        --enable-hierarchical-namespace false
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create storage account.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Storage account created.${NC}"
else
    echo -e "${GREEN}Storage account exists.${NC}"
fi

# Get storage account key
echo -e "${BLUE}Getting storage account key...${NC}"
STORAGE_KEY=$(az storage account keys list --resource-group "$RESOURCE_GROUP" --account-name "$STORAGE_ACCOUNT_NAME" --query "[0].value" -o tsv)
if [ -z "$STORAGE_KEY" ]; then
    echo -e "${RED}Failed to get storage account key.${NC}"
    exit 1
fi

# Create storage connection string
CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=${STORAGE_ACCOUNT_NAME};AccountKey=${STORAGE_KEY};EndpointSuffix=core.windows.net"

# Create container if it doesn't exist
echo -e "${BLUE}Checking storage container...${NC}"
if ! az storage container show --name "$CONTAINER_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_KEY" &>/dev/null; then
    echo -e "${YELLOW}Container doesn't exist. Creating...${NC}"
    az storage container create --name "$CONTAINER_NAME" --account-name "$STORAGE_ACCOUNT_NAME" --account-key "$STORAGE_KEY" --public-access off
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create container.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Container created.${NC}"
else
    echo -e "${GREEN}Container exists.${NC}"
fi

# Write information to console for copying
echo -e "\n${BLUE}Azure Storage Account Information${NC}"
echo -e "${YELLOW}----------------------------------------${NC}"
echo -e "${GREEN}Resource Group:${NC} $RESOURCE_GROUP"
echo -e "${GREEN}Storage Account:${NC} $STORAGE_ACCOUNT_NAME"
echo -e "${GREEN}Container:${NC} $CONTAINER_NAME"
echo -e "${GREEN}Location:${NC} $LOCATION"
echo -e "${YELLOW}----------------------------------------${NC}"
echo -e "${GREEN}Connection String:${NC}"
echo "$CONNECTION_STRING"
echo -e "${YELLOW}----------------------------------------${NC}"
echo -e "${BLUE}Instructions:${NC}"
echo "1. Copy the connection string above to your appsettings.Production.json file"
echo "2. Set the Storage:Azure:ConnectionString value to the connection string"
echo "3. Set the Storage:Azure:ContainerName value to '$CONTAINER_NAME'"
echo "4. When ready to migrate files, set Storage:Azure:EnableMigration to true"
echo -e "${YELLOW}----------------------------------------${NC}"

exit 0 