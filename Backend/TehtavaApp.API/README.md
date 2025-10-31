# TehtavaApp Backend

This document provides comprehensive information about the TehtavaApp backend application, including setup instructions, architecture overview, and development guidelines.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Development Guidelines](#development-guidelines)
- [Troubleshooting](#troubleshooting)

## Overview

TehtavaApp is an educational platform designed to facilitate course management, assignment submission, and student evaluation. The backend is built with ASP.NET Core 8.0 and follows a clean architecture approach with separation of concerns.

### Key Features

- User authentication and role-based authorization
- Course and group management
- Assignment creation and submission
- Grading and feedback system
- Content block management for course materials
- File upload and management
- Notification system

## Getting Started

### Prerequisites

- [.NET SDK 8.0](https://dotnet.microsoft.com/download/dotnet/8.0) or later
- SQL Server (local or remote)
- Visual Studio 2022, Visual Studio Code, or JetBrains Rider

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tehtavaapp.git
   cd tehtavaapp/Backend
   ```

2. Restore dependencies:
   ```bash
   dotnet restore
   ```

3. Build the project:
   ```bash
   dotnet build
   ```

4. Run the application:
   ```bash
   dotnet run --project TehtavaApp.API
   ```

### Configuration

The application uses the following configuration files:

- `appsettings.json`: Base configuration
- `appsettings.Development.json`: Development environment configuration
- `appsettings.Production.json`: Production environment configuration

Key configuration sections:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOURSERVER;Database=tehtavaApplicationDevelopment;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True;"
  },
  "JwtSettings": {
    "Key": "your-super-secret-key-with-at-least-32-characters",
    "Issuer": "https://localhost:5000",
    "Audience": "https://localhost:5173",
    "ExpiryInDays": 7
  },
  "AdminUser": {
    "Email": "admin@tehtavaapp.com",
    "Password": "Admin123!"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173"
    ]
  },
  "FileStorage": {
    "BasePath": "wwwroot/uploads",
    "AllowedExtensions": [".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png"],
    "MaxFileSizeBytes": 10485760
  }
}
```

## Project Structure

The backend follows a clean architecture approach with the following structure:

- **TehtavaApp.API**: Main entry point, contains controllers, middleware, and configuration
- **TehtavaApp.Core**: Business logic, domain models, and interfaces
- **TehtavaApp.Infrastructure**: Data access, external services, and implementations
- **TehtavaApp.Tests**: Unit and integration tests

### Key Components

- **Controllers**: API endpoints organized by domain
- **Services**: Business logic implementation
- **Models**: Domain entities and DTOs
- **Data**: Database context and migrations
- **Hubs**: SignalR hubs for real-time communication

## API Documentation

The API follows RESTful principles and uses JWT for authentication. The main API endpoints include:

### Authentication

- `POST /api/auth/login`: Authenticate user
- `POST /api/auth/register`: Register new user
- `POST /api/auth/logout`: Logout user
- `GET /api/auth/users`: Get all users (Admin only)

### Courses

- `GET /api/course`: Get all courses
- `GET /api/course/{id}`: Get course by ID
- `POST /api/course`: Create new course
- `PUT /api/course/{id}`: Update course
- `DELETE /api/course/{id}`: Delete course

### Groups

- `GET /api/group`: Get all groups
- `GET /api/group/{id}`: Get group by ID
- `POST /api/group`: Create new group
- `PUT /api/group/{id}`: Update group
- `DELETE /api/group/{id}`: Delete group
- `GET /api/group/{id}/available-students`: Get available students for group

### Assignments

- `GET /api/assignment`: Get all assignments
- `GET /api/assignment/{id}`: Get assignment by ID
- `POST /api/assignment`: Create new assignment
- `PUT /api/assignment/{id}`: Update assignment
- `DELETE /api/assignment/{id}`: Delete assignment

### Submissions

- `GET /api/submission`: Get all submissions
- `GET /api/submission/{id}`: Get submission by ID
- `POST /api/submission`: Create new submission
- `PUT /api/submission/{id}`: Update submission
- `DELETE /api/submission/{id}`: Delete submission

## Database

The application uses Entity Framework Core with SQL Server. The database schema is managed through code-first migrations.

### Entity Relationships

- **User**: Represents system users (students, teachers, admins)
- **Course**: Educational courses with content blocks
- **Group**: Student groups that can be enrolled in courses
- **Assignment**: Tasks assigned to students
- **Submission**: Student submissions for assignments
- **Block**: Content blocks for course materials

### Running Migrations

```bash
# Add a new migration
dotnet ef migrations add MigrationName --project TehtavaApp.API

# Update the database
dotnet ef database update --project TehtavaApp.API
```

## Authentication

The application uses JWT (JSON Web Tokens) for authentication with the following roles:

- **Admin**: Full system access
- **Teacher**: Course management, assignment creation, and grading
- **Student**: Course enrollment, assignment submission

## Deployment

### Azure VM Deployment

To deploy the application to an Azure Linux VM with Nginx:

1. Set up an Azure Linux VM with Ubuntu
2. Install required software:
   ```bash
   sudo apt update
   sudo apt install -y nginx dotnet-sdk-6.0
   ```

3. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
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
   }
   ```

4. Create a service file:
   ```ini
   [Unit]
   Description=TehtavaApp API

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

5. Set up SSL with Certbot:
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

### Azure DevOps Pipeline

For automated deployment, see the Azure DevOps pipeline configuration in the project root.

## Development Guidelines

### Coding Standards

- Follow C# coding conventions
- Use async/await for asynchronous operations
- Implement proper exception handling
- Write unit tests for business logic
- Document public APIs with XML comments

### Adding New Features

1. Create a new branch from `develop`
2. Implement the feature with appropriate tests
3. Submit a pull request for review
4. Merge to `develop` after approval

### Database Changes

1. Create a new migration for schema changes
2. Test the migration locally
3. Include migration scripts in the pull request

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Check connection string in appsettings.json
   - Verify SQL Server is running
   - Ensure firewall allows connections

2. **Authentication Issues**:
   - Verify JWT settings in configuration
   - Check token expiration
   - Ensure roles are correctly assigned

3. **CORS Issues**:
   - Verify allowed origins in configuration
   - Check browser console for CORS errors

### Logging

The application uses structured logging with Serilog. Logs are written to:

- Console (development)
- Files (production)
- Application Insights (if configured)

To enable debug logging, update the `LogLevel` in appsettings.json:

```json
"Logging": {
  "LogLevel": {
    "Default": "Debug",
    "Microsoft.AspNetCore": "Information"
  }
}
```

---

For additional support or questions, please contact the development team. 