# Azure DevOps Pipeline Configuration

This document describes the Azure DevOps pipeline configuration for deploying the application to Azure Virtual Machines for both test and production environments.

## Pipeline Overview

The pipeline is configured to:

1. Build the .NET backend application
2. Build the React frontend application
3. Deploy the applications to the appropriate environment (test or production)
4. Configure Nginx and set up the services

## Prerequisites

- Azure DevOps account with appropriate permissions
- Azure Virtual Machine for test environment
- Azure Virtual Machine for production environment
- Service connection to Azure Resource Manager
- SSH key pair for VM access
- Variable groups for environment-specific configurations

## Pipeline Structure

The pipeline is divided into several stages:

1. **Build Stage**: Compiles the backend and frontend applications
2. **Test Stage**: Runs unit tests and integration tests
3. **Deploy Test Stage**: Deploys to the test environment
4. **Deploy Production Stage**: Deploys to the production environment (with approval)

## Variable Groups

### Common Variables

- `projectName`: The name of the project
- `vmUsername`: The username for the VM
- `backendProjectPath`: Path to the backend project
- `frontendProjectPath`: Path to the frontend project

### Test Environment Variables

- `testVmIp`: IP address of the test VM
- `testDomain`: Domain name for the test environment
- `testApiPort`: Port for the test API service

### Production Environment Variables

- `prodVmIp`: IP address of the production VM
- `prodDomain`: Domain name for the production environment
- `prodApiPort`: Port for the production API service

## Deployment Process

### Backend Deployment

1. The .NET application is built using the `dotnet publish` command
2. The published files are packaged into a zip file
3. The package is transferred to the VM using SCP
4. The application is extracted to the appropriate directory
5. The .NET service is configured and restarted

### Frontend Deployment

1. Node.js dependencies are installed
2. The React application is built with environment-specific configurations
3. The build output is packaged into a zip file
4. The package is transferred to the VM using SCP
5. The application is extracted to the appropriate directory

### Nginx Configuration

1. Nginx configuration files are created for each environment
2. SSL certificates are set up using Let's Encrypt
3. Nginx is reloaded to apply the new configuration

### API Path Configuration

The Nginx configuration includes a special rewrite rule for the API path to prevent duplication:

```nginx
location /api/ {
    # Remove the /api prefix before proxying to prevent duplication
    rewrite ^/api/(.*) /$1 break;
    proxy_pass http://localhost:5000;
    # ... other proxy settings ...
}
```

This configuration ensures that:
- Frontend requests to `/api/auth/users` are correctly routed to the backend as `/auth/users`
- No path duplication occurs (avoiding issues like `/api/api/auth/users`)
- The API remains accessible through the `/api` prefix from the frontend

## Pipeline Triggers

- **Main Branch**: Triggers deployment to the production environment (with approval)
- **Develop Branch**: Triggers deployment to the test environment

## Manual Deployment

To manually trigger a deployment:

1. Go to the Azure DevOps portal
2. Navigate to Pipelines
3. Select the appropriate pipeline
4. Click "Run Pipeline"
5. Select the branch and environment
6. Click "Run"

## Troubleshooting

If the pipeline fails, check the following:

1. **Build Errors**: Check the build logs for compilation errors
2. **Deployment Errors**: Check the deployment logs for SSH or file transfer issues
3. **Service Errors**: Check the VM logs for service startup issues
4. **Nginx Errors**: Check the Nginx error logs for configuration issues

## Security Considerations

- SSH keys are stored as secure files in Azure DevOps
- Sensitive variables are marked as secret
- Production deployments require manual approval
- Service accounts have minimal permissions

## Maintenance

- Update the pipeline configuration when new dependencies are added
- Review and update the variable groups when environment configurations change
- Rotate SSH keys periodically for security
- Monitor pipeline execution times and optimize as needed

## Esitiedot

Ennen kuin voit käyttää tätä pipeline-määritystä, sinulla tulee olla:

1. Azure DevOps -organisaatio ja projekti
2. Azure-tilaus
3. Kaksi Azure App Service -instanssia:
   - Backend API:lle (esim. tehtavaapp-api)
   - Frontend-sovellukselle (esim. tehtavaapp-web)
4. Oikeudet luoda Service Connection Azure DevOps:ssa

## Käyttöönotto

### 1. Service Connection -yhteyden luominen

1. Mene Azure DevOps -projektiin
2. Valitse Project Settings > Service connections
3. Klikkaa "New service connection"
4. Valitse "Azure Resource Manager"
5. Valitse "Service principal (automatic)"
6. Täytä tarvittavat tiedot:
   - Subscription: Valitse Azure-tilauksesi
   - Resource Group: Valitse resurssiryhmä, jossa App Service -instanssit sijaitsevat
   - Service connection name: Anna yhteydelle nimi (esim. "TehtavaApp-Azure")

### 2. Pipelinen luominen

1. Mene Azure DevOps -projektiin
2. Valitse Pipelines > Pipelines
3. Klikkaa "New pipeline"
4. Valitse koodin lähde (esim. Azure Repos Git, GitHub)
5. Valitse repositorio
6. Valitse "Existing Azure Pipelines YAML file"
7. Valitse polku: `/azure-pipelines.yml`
8. Tarkista pipeline-määritys ja päivitä seuraavat arvot:
   - `azureSubscription`: Korvaa "YourAzureSubscription" luomasi Service Connection -yhteyden nimellä
   - `WebAppName`: Korvaa "tehtavaapp-api" ja "tehtavaapp-web" omien App Service -instanssiesi nimillä

### 3. Ympäristömuuttujien konfigurointi

#### Frontend-ympäristömuuttujat

Päivitä `Frontend/tehtavaappfrontend/public/config.js` -tiedosto vastaamaan backend API:n osoitetta:

```javascript
window.ENV = {
  API_URL: "https://sinun-api-nimi.azurewebsites.net/api",
  SIGNALR_URL: "https://sinun-api-nimi.azurewebsites.net/hubs",
  APP_VERSION: "1.0.0"
};
```

#### Backend-ympäristömuuttujat

Määritä seuraavat ympäristömuuttujat Azure App Service -instanssille (tehtavaapp-api):

1. Mene Azure-portaaliin
2. Avaa App Service -instanssi (backend)
3. Valitse Configuration > Application settings
4. Lisää seuraavat asetukset:
   - `ConnectionStrings__DefaultConnection`: SQL Server -yhteysmerkkijono
   - `JwtSettings__Secret`: JWT-salausavain
   - `JwtSettings__Issuer`: JWT-myöntäjä
   - `JwtSettings__Audience`: JWT-yleisö
   - `JwtSettings__ExpiryMinutes`: JWT-voimassaoloaika minuutteina
   - `ASPNETCORE_ENVIRONMENT`: Production

## Pipeline-määrityksen selitys

Pipeline koostuu kahdesta vaiheesta:

### Build-vaihe

1. **BuildBackend-työ**:
   - Asentaa .NET SDK:n
   - Palauttaa NuGet-paketit
   - Rakentaa backend-projektin
   - Julkaisee backend-projektin ZIP-tiedostona
   - Tallentaa artefaktin

2. **BuildFrontend-työ**:
   - Asentaa Node.js
   - Asentaa npm-paketit
   - Rakentaa frontend-projektin
   - Kopioi build-kansion sisällön artefaktikansioon
   - Tallentaa artefaktin

### Deploy-vaihe

1. **DeployBackend-työ**:
   - Julkaisee backend-artefaktin Azure App Service -instanssiin

2. **DeployFrontend-työ**:
   - Julkaisee frontend-artefaktin Azure App Service -instanssiin

## Vianmääritys

Jos pipeline epäonnistuu, tarkista seuraavat asiat:

1. Service Connection -yhteys on määritetty oikein
2. App Service -instanssit ovat olemassa ja käynnissä
3. Pipeline-määrityksessä on oikeat nimet ja polut
4. Backend-projektin build onnistuu paikallisesti
5. Frontend-projektin build onnistuu paikallisesti

## Lisätietoja

- [Azure DevOps -dokumentaatio](https://docs.microsoft.com/en-us/azure/devops/)
- [Azure App Service -dokumentaatio](https://docs.microsoft.com/en-us/azure/app-service/)
- [YAML-pipelinejen dokumentaatio](https://docs.microsoft.com/en-us/azure/devops/pipelines/yaml-schema/) 