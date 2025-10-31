# Script to set up Azure Blob Storage for TehtavaApp
# Prerequisites: Azure PowerShell module installed and connected to Azure (Connect-AzAccount)

# Configuration - CHANGE THESE VALUES
$ResourceGroup = "tehtavaapp-rg"
$StorageAccountName = "tehtavaappstorage"
$Location = "northeurope"
$ContainerName = "uploads"
$StorageSku = "Standard_LRS"  # Options: Standard_LRS, Standard_GRS, Standard_RAGRS, etc.

# Check if Azure PowerShell is installed
if (-not (Get-Module -ListAvailable -Name Az.Storage)) {
    Write-Host "Azure PowerShell modules not found. Please install them:" -ForegroundColor Red
    Write-Host "Install-Module -Name Az -AllowClobber -Scope CurrentUser" -ForegroundColor Yellow
    exit
}

# Check if logged in to Azure
try {
    $context = Get-AzContext
    if (-not $context) { throw }
    Write-Host "Logged in to Azure as: $($context.Account.Id) (Subscription: $($context.Subscription.Name))" -ForegroundColor Green
}
catch {
    Write-Host "Not logged in to Azure. Please log in:" -ForegroundColor Yellow
    Connect-AzAccount
    $context = Get-AzContext
    Write-Host "Logged in to Azure as: $($context.Account.Id) (Subscription: $($context.Subscription.Name))" -ForegroundColor Green
}

# Create resource group if it doesn't exist
Write-Host "Checking resource group..." -ForegroundColor Cyan
try {
    Get-AzResourceGroup -Name $ResourceGroup -ErrorAction Stop | Out-Null
    Write-Host "Resource group exists." -ForegroundColor Green
}
catch {
    Write-Host "Resource group doesn't exist. Creating..." -ForegroundColor Yellow
    try {
        New-AzResourceGroup -Name $ResourceGroup -Location $Location | Out-Null
        Write-Host "Resource group created." -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create resource group: $_" -ForegroundColor Red
        exit
    }
}

# Create storage account if it doesn't exist
Write-Host "Checking storage account..." -ForegroundColor Cyan
try {
    Get-AzStorageAccount -ResourceGroupName $ResourceGroup -Name $StorageAccountName -ErrorAction Stop | Out-Null
    Write-Host "Storage account exists." -ForegroundColor Green
}
catch {
    Write-Host "Storage account doesn't exist. Creating..." -ForegroundColor Yellow
    try {
        New-AzStorageAccount -ResourceGroupName $ResourceGroup -Name $StorageAccountName -Location $Location -SkuName $StorageSku -Kind StorageV2 | Out-Null
        Write-Host "Storage account created." -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create storage account: $_" -ForegroundColor Red
        exit
    }
}

# Get storage account key and create connection string
Write-Host "Getting storage account key..." -ForegroundColor Cyan
try {
    $storageKey = (Get-AzStorageAccountKey -ResourceGroupName $ResourceGroup -Name $StorageAccountName)[0].Value
    $connectionString = "DefaultEndpointsProtocol=https;AccountName=$StorageAccountName;AccountKey=$storageKey;EndpointSuffix=core.windows.net"
}
catch {
    Write-Host "Failed to get storage account key: $_" -ForegroundColor Red
    exit
}

# Create container if it doesn't exist
Write-Host "Checking storage container..." -ForegroundColor Cyan
$storageContext = New-AzStorageContext -StorageAccountName $StorageAccountName -StorageAccountKey $storageKey
try {
    Get-AzStorageContainer -Name $ContainerName -Context $storageContext -ErrorAction Stop | Out-Null
    Write-Host "Container exists." -ForegroundColor Green
}
catch {
    Write-Host "Container doesn't exist. Creating..." -ForegroundColor Yellow
    try {
        New-AzStorageContainer -Name $ContainerName -Context $storageContext -Permission Off | Out-Null
        Write-Host "Container created." -ForegroundColor Green
    }
    catch {
        Write-Host "Failed to create container: $_" -ForegroundColor Red
        exit
    }
}

# Write information to console for copying
Write-Host "`nAzure Storage Account Information" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Green
Write-Host "Storage Account: $StorageAccountName" -ForegroundColor Green
Write-Host "Container: $ContainerName" -ForegroundColor Green
Write-Host "Location: $Location" -ForegroundColor Green
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "Connection String:" -ForegroundColor Green
Write-Host $connectionString
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host "Instructions:" -ForegroundColor Cyan
Write-Host "1. Copy the connection string above to your appsettings.Production.json file"
Write-Host "2. Set the Storage:Azure:ConnectionString value to the connection string"
Write-Host "3. Set the Storage:Azure:ContainerName value to '$ContainerName'"
Write-Host "4. When ready to migrate files, set Storage:Azure:EnableMigration to true"
Write-Host "----------------------------------------" -ForegroundColor Yellow 