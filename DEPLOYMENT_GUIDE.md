# TehtavaApp Full-Stack Deployment Guide

This document provides comprehensive instructions for deploying the complete TehtavaApp application (both backend and frontend) to an Azure Linux Virtual Machine using Nginx as a web server.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Azure VM Setup](#azure-vm-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL Configuration](#ssl-configuration)
- [Database Setup](#database-setup)
- [Service Configuration](#service-configuration)
- [Azure DevOps Pipeline](#azure-devops-pipeline)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Prerequisites

Before starting the deployment process, ensure you have:

- An Azure account with an active subscription
- SSH access to your Azure VM
- Domain name (for SSL configuration)
- Azure DevOps organization and project (for CI/CD)
- Backend and frontend application code ready for deployment

## Azure VM Setup

### 1. Create a Linux VM in Azure

1. Log in to the [Azure Portal](https://portal.azure.com)
2. Navigate to "Virtual machines" and click "Create"
3. Select "Azure virtual machine"
4. Configure the VM:
   - **Basics**:
     - Resource group: Create new or select existing
     - VM name: `tehtavaapp-vm`
     - Region: Select nearest region
     - Availability options: No infrastructure redundancy required
     - Security type: Standard
     - Image: Ubuntu Server 20.04 LTS
     - Size: Standard_B2s (2 vCPUs, 4 GiB memory) or higher
   - **Administrator account**:
     - Authentication type: SSH public key
     - Username: `azureuser`
     - SSH public key source: Generate new key pair or use existing
   - **Inbound port rules**:
     - Allow SSH (22), HTTP (80), and HTTPS (443)

2. Complete the VM creation process and wait for deployment to finish

### 2. Install Required Software

Connect to your VM via SSH:

```bash
ssh azureuser@your-vm-ip
```

Update the system and install required packages:

```bash
# Update package lists
sudo apt update
sudo apt upgrade -y

# Install .NET SDK
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt update
sudo apt install -y apt-transport-https
sudo apt install -y dotnet-sdk-6.0

# Install Node.js and npm (for frontend builds if needed)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

## Backend Deployment

### 1. Prepare Deployment Directory

Create directories for the backend application:

```bash
sudo mkdir -p /var/www/tehtavaapp/api
sudo chown -R azureuser:azureuser /var/www/tehtavaapp
```

### 2. Build and Publish the Backend Application

On your development machine:

```bash
# Navigate to the backend project directory
cd path/to/tehtavaapp/Backend

# Publish the application
dotnet publish -c Release -o ./publish
```

### 3. Transfer Backend Files to VM

Use SCP to transfer the published files:

```bash
# From your development machine
cd path/to/tehtavaapp/Backend/publish
scp -r * azureuser@your-vm-ip:/var/www/tehtavaapp/api/
```

### 4. Set Backend Permissions

On the VM:

```bash
sudo chown -R www-data:www-data /var/www/tehtavaapp/api
sudo chmod -R 755 /var/www/tehtavaapp/api
```

### 5. Configure Backend Settings

Create or update the production settings file:

```bash
sudo nano /var/www/tehtavaapp/api/appsettings.Production.json
```

Add the following configuration:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TehtavaApp;User Id=TehtavaAppUser;Password=YourStrongPassword;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Key": "your-super-secret-key-with-at-least-32-characters",
    "Issuer": "https://your-domain.com",
    "Audience": "https://your-domain.com",
    "ExpiryInDays": 7
  },
  "Cors": {
    "AllowedOrigins": [
      "https://your-domain.com"
    ]
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "FileStorage": {
    "BasePath": "wwwroot/uploads",
    "AllowedExtensions": [".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png"],
    "MaxFileSizeBytes": 10485760
  }
}
```

## Frontend Deployment

### 1. Prepare Deployment Directory

Create directories for the frontend application:

```bash
sudo mkdir -p /var/www/tehtavaapp/frontend
sudo chown -R azureuser:azureuser /var/www/tehtavaapp/frontend
```

### 2. Build the Frontend Application

On your development machine:

```bash
# Navigate to the frontend project directory
cd path/to/tehtavaapp/Frontend/tehtavaappfrontend

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOL
VITE_API_URL=https://your-domain.com
EOL

# Build the application
npm run build
```

### 3. Transfer Frontend Files to VM

Use SCP to transfer the built files:

```bash
# From your development machine
cd path/to/tehtavaapp/Frontend/tehtavaappfrontend/build
scp -r * azureuser@your-vm-ip:/var/www/tehtavaapp/frontend/
```

### 4. Set Frontend Permissions

On the VM:

```bash
sudo chown -R www-data:www-data /var/www/tehtavaapp/frontend
sudo chmod -R 755 /var/www/tehtavaapp/frontend
```

## Nginx Configuration

### 1. Create Nginx Configuration File

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/tehtavaapp
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    # SSL configuration will be added by Certbot
    
    # Frontend
    location / {
        root /var/www/tehtavaapp/frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 30d;
            add_header Cache-Control "public, no-transform";
        }
    }
    
    # API - Fixed to prevent path duplication
    location /api/ {
        # Remove the /api prefix before proxying to prevent duplication
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # SignalR hub configuration
    location /hubs/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /uploads/ {
        alias /var/www/tehtavaapp/api/wwwroot/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # Error logs
    error_log /var/log/nginx/tehtavaapp-error.log;
    access_log /var/log/nginx/tehtavaapp-access.log;
}
```

### 2. Enable the Configuration

```bash
sudo ln -s /etc/nginx/sites-available/tehtavaapp /etc/nginx/sites-enabled/
sudo nginx -t  # Test the configuration
sudo systemctl reload nginx
```

## SSL Configuration

### 1. Set Up SSL with Certbot

```bash
sudo certbot --nginx -d your-domain.com
```

Follow the prompts to complete the SSL configuration.

### 2. Verify SSL Configuration

Visit `https://your-domain.com` to verify that SSL is working correctly for the frontend.
Visit `https://your-domain.com/api/health` to verify that SSL is working correctly for the backend.

## Database Setup

### 1. Install SQL Server on Linux

```bash
# Import the public repository GPG keys
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -

# Register the SQL Server Ubuntu repository
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2019.list)"

# Install SQL Server
sudo apt update
sudo apt install -y mssql-server

# Configure SQL Server
sudo /opt/mssql/bin/mssql-conf setup
```

### 2. Install SQL Server Command-Line Tools

```bash
# Import the public repository GPG keys
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -

# Register the Microsoft Ubuntu repository
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list

# Install SQL Server tools
sudo apt update
sudo apt install -y mssql-tools unixodbc-dev

# Add SQL Server tools to PATH
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 3. Create Database and User

```bash
# Connect to SQL Server
sqlcmd -S localhost -U SA -P 'YourStrongPassword'

# Create database
CREATE DATABASE TehtavaApp;
GO

# Create login
CREATE LOGIN TehtavaAppUser WITH PASSWORD = 'YourStrongPassword';
GO

# Create user and grant permissions
USE TehtavaApp;
GO
CREATE USER TehtavaAppUser FOR LOGIN TehtavaAppUser;
GO
ALTER ROLE db_owner ADD MEMBER TehtavaAppUser;
GO
EXIT
```

## Service Configuration

### 1. Create Systemd Service

Create a service file for the backend application:

```bash
sudo nano /etc/systemd/system/tehtavaapp-api.service
```

Add the following configuration:

```ini
[Unit]
Description=TehtavaApp API
After=network.target

[Service]
WorkingDirectory=/var/www/tehtavaapp/api
ExecStart=/usr/bin/dotnet /var/www/tehtavaapp/api/TehtavaApp.API.dll
Restart=always
RestartSec=10
SyslogIdentifier=tehtavaapp-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false
Environment=ASPNETCORE_URLS=http://localhost:5001

[Install]
WantedBy=multi-user.target
```

### 2. Enable and Start the Service

```bash
sudo systemctl enable tehtavaapp-api.service
sudo systemctl start tehtavaapp-api.service
sudo systemctl status tehtavaapp-api.service
```

## Azure DevOps Pipeline

### 1. Create Azure DevOps Pipeline

Create a file named `azure-pipelines.yml` in your repository:

```yaml
trigger:
  branches:
    include:
    - main

variables:
  vmUsername: 'azureuser'
  vmIp: '$(VM_IP)'
  domain: '$(DOMAIN)'
  apiPort: '5001'
  backendProjectPath: 'Backend'
  frontendProjectPath: 'Frontend/tehtavaappfrontend'

stages:
- stage: Build
  displayName: 'Build Stage'
  jobs:
  - job: BuildBackend
    displayName: 'Build Backend'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: UseDotNet@2
      displayName: 'Use .NET SDK'
      inputs:
        packageType: 'sdk'
        version: '6.0.x'
    
    - task: DotNetCoreCLI@2
      displayName: 'Restore Backend Dependencies'
      inputs:
        command: 'restore'
        projects: '$(backendProjectPath)/*.csproj'
    
    - task: DotNetCoreCLI@2
      displayName: 'Build Backend'
      inputs:
        command: 'build'
        projects: '$(backendProjectPath)/*.csproj'
        arguments: '--configuration Release'
    
    - task: DotNetCoreCLI@2
      displayName: 'Publish Backend'
      inputs:
        command: 'publish'
        publishWebProjects: false
        projects: '$(backendProjectPath)/*.csproj'
        arguments: '--configuration Release --output $(Build.ArtifactStagingDirectory)/backend'
        zipAfterPublish: true
        modifyOutputPath: false
    
    - task: PublishBuildArtifacts@1
      displayName: 'Publish Backend Artifacts'
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)/backend'
        ArtifactName: 'backend'
        publishLocation: 'Container'
  
  - job: BuildFrontend
    displayName: 'Build Frontend'
    pool:
      vmImage: 'ubuntu-latest'
    steps:
    - task: NodeTool@0
      displayName: 'Use Node.js'
      inputs:
        versionSpec: '16.x'
    
    - task: Npm@1
      displayName: 'Install Frontend Dependencies'
      inputs:
        command: 'install'
        workingDir: '$(frontendProjectPath)'
    
    - task: Bash@3
      displayName: 'Create Environment File'
      inputs:
        targetType: 'inline'
        script: |
          # Create production environment file
          echo "VITE_API_URL=https://$(domain)" > $(frontendProjectPath)/.env.production
          
          # Display environment file for debugging
          echo "Production Environment File:"
          cat $(frontendProjectPath)/.env.production
    
    - task: Npm@1
      displayName: 'Build Frontend'
      inputs:
        command: 'custom'
        workingDir: '$(frontendProjectPath)'
        customCommand: 'run build'
    
    - task: ArchiveFiles@2
      displayName: 'Archive Frontend'
      inputs:
        rootFolderOrFile: '$(frontendProjectPath)/build'
        includeRootFolder: false
        archiveType: 'zip'
        archiveFile: '$(Build.ArtifactStagingDirectory)/frontend/frontend.zip'
        replaceExistingArchive: true
    
    - task: PublishBuildArtifacts@1
      displayName: 'Publish Frontend Artifacts'
      inputs:
        PathtoPublish: '$(Build.ArtifactStagingDirectory)/frontend'
        ArtifactName: 'frontend'
        publishLocation: 'Container'

- stage: Deploy
  displayName: 'Deploy to Production'
  dependsOn: Build
  jobs:
  - deployment: DeployProduction
    displayName: 'Deploy to VM'
    environment: 'production'
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
          - task: DownloadBuildArtifacts@0
            displayName: 'Download Backend Artifacts'
            inputs:
              buildType: 'current'
              downloadType: 'specific'
              itemPattern: 'backend/**'
              downloadPath: '$(System.ArtifactsDirectory)'
          
          - task: DownloadBuildArtifacts@0
            displayName: 'Download Frontend Artifacts'
            inputs:
              buildType: 'current'
              downloadType: 'specific'
              itemPattern: 'frontend/**'
              downloadPath: '$(System.ArtifactsDirectory)'
          
          - task: InstallSSHKey@0
            displayName: 'Install SSH Key'
            inputs:
              knownHostsEntry: '$(KNOWN_HOSTS)'
              sshPublicKey: '$(SSH_PUBLIC_KEY)'
              sshKeySecureFile: 'vm_ssh_key'
          
          - task: Bash@3
            displayName: 'Deploy to VM'
            inputs:
              targetType: 'inline'
              script: |
                # Create deployment directories on VM
                ssh $(vmUsername)@$(vmIp) "mkdir -p /tmp/api /tmp/frontend"
                
                # Copy backend files to VM
                scp $(System.ArtifactsDirectory)/backend/*.zip $(vmUsername)@$(vmIp):/tmp/api/backend.zip
                
                # Copy frontend files to VM
                scp $(System.ArtifactsDirectory)/frontend/*.zip $(vmUsername)@$(vmIp):/tmp/frontend/frontend.zip
                
                # Execute deployment script on VM
                ssh $(vmUsername)@$(vmIp) "bash -s" << 'EOF'
                  # Extract backend files
                  sudo mkdir -p /var/www/tehtavaapp/api
                  sudo unzip -o /tmp/api/backend.zip -d /var/www/tehtavaapp/api/
                  sudo chown -R www-data:www-data /var/www/tehtavaapp/api
                  
                  # Extract frontend files
                  sudo mkdir -p /var/www/tehtavaapp/frontend
                  sudo unzip -o /tmp/frontend/frontend.zip -d /var/www/tehtavaapp/frontend/
                  sudo chown -R www-data:www-data /var/www/tehtavaapp/frontend
                  
                  # Restart the service
                  sudo systemctl restart tehtavaapp-api.service
                  
                  # Clean up temporary files
                  rm -f /tmp/api/backend.zip
                  rm -f /tmp/frontend/frontend.zip
                EOF
```

### 2. Configure Pipeline Variables

In Azure DevOps, create the following variables:

- `VM_IP`: Your VM's IP address
- `DOMAIN`: Your domain name
- `KNOWN_HOSTS`: The known_hosts entry for your VM
- `SSH_PUBLIC_KEY`: Your SSH public key

### 3. Upload SSH Key

Upload your SSH private key as a secure file named `vm_ssh_key` in Azure DevOps.

## Troubleshooting

### Common Issues

#### 1. Backend Service Won't Start

Check the service logs:

```bash
sudo journalctl -u tehtavaapp-api.service
```

#### 2. Nginx Configuration Issues

Test the Nginx configuration:

```bash
sudo nginx -t
```

#### 3. Database Connection Issues

Verify the connection string and SQL Server status:

```bash
sudo systemctl status mssql-server
```

#### 4. Permission Issues

Check file permissions:

```bash
ls -la /var/www/tehtavaapp/api
ls -la /var/www/tehtavaapp/frontend
```

#### 5. SSL Certificate Issues

Check Certbot logs:

```bash
sudo certbot certificates
```

#### 6. Frontend API Connection Issues

If the frontend can't connect to the backend API, check:

- The `VITE_API_URL` environment variable in the frontend build
- CORS configuration in the backend
- Nginx configuration for the `/api/` location

#### 7. Path Duplication Issues

If you see 404 errors with paths like `/api/api/...`, check the Nginx configuration to ensure the rewrite rule is correctly removing the `/api` prefix:

```nginx
location /api/ {
    # Remove the /api prefix before proxying to prevent duplication
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://localhost:5001;
    # ... other settings ...
}
```

## Maintenance

### Regular Updates

#### 1. Update OS and Packages

```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. Renew SSL Certificates

Certbot will automatically renew certificates, but you can test the renewal process:

```bash
sudo certbot renew --dry-run
```

#### 3. Backup Database

```bash
# Create a backup directory
sudo mkdir -p /var/backups/tehtavaapp

# Backup the database
sudo -u mssql /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -P 'YourStrongPassword' -Q "BACKUP DATABASE TehtavaApp TO DISK = N'/var/backups/tehtavaapp/tehtavaapp_$(date +%Y%m%d).bak' WITH NOFORMAT, NOINIT, NAME = 'TehtavaApp-Full Database Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10"
```

#### 4. Monitor Logs

```bash
# Check application logs
sudo journalctl -u tehtavaapp-api.service

# Check Nginx logs
sudo tail -f /var/log/nginx/tehtavaapp-error.log
sudo tail -f /var/log/nginx/tehtavaapp-access.log
```

#### 5. Update Application

To update the application:

1. Build new versions of the backend and frontend
2. Deploy the new versions using the same process as the initial deployment
3. Restart the backend service:
   ```bash
   sudo systemctl restart tehtavaapp-api.service
   ```

---

This deployment guide provides comprehensive instructions for deploying the complete TehtavaApp application to an Azure Linux VM. For additional support or questions, please contact the development team. 