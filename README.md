# TehtavaApp - Assignment Management System

## 🌍 Languages / Kielet
- [English](#english)
- [Suomi](#suomi)

---

# English

## 📖 Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [User Roles](#user-roles)
4. [Getting Started](#getting-started)
5. [Usage Guide](#usage-guide)
6. [Technical Stack](#technical-stack)
7. [Installation](#installation)
8. [Configuration](#configuration)
9. [API Documentation](#api-documentation)
10. [Contributing](#contributing)

## Overview

**TehtavaApp** is a comprehensive web-based assignment and course management system designed for educational institutions. It enables teachers to create courses, manage materials, assign tasks, and track student progress, while providing students with an intuitive interface to access course content, submit assignments, and monitor their performance.

### Key Highlights
- 📚 **Course Management** - Create and manage courses with materials and assignments
- 👥 **Group Management** - Organize students into groups for collaborative work
- 📝 **Assignment System** - Create, assign, and grade assignments with rubrics
- 🤖 **AI-Powered Grading** - Automated assignment grading with OpenAI/Azure OpenAI
- 📄 **Material Distribution** - Upload and share course materials (PDFs, documents, images)
- 📊 **Progress Tracking** - Monitor student performance and generate statistics
- 🔔 **Real-time Notifications** - Stay updated with course activities
- 💬 **Inline Comments** - Provide detailed feedback on submissions
- 🎯 **Grading System** - Comprehensive grading with rubrics and history

## Features

### For Teachers

#### 📚 Course Management
- **Create Courses**
  - Set course name, description, start/end dates
  - Define course structure and objectives
  - Activate/deactivate courses
  - Add multiple teachers to a course

- **Course Materials**
  - Upload files (PDF, Word, Excel, PowerPoint, images)
  - Organize materials by topic
  - Bulk upload multiple materials
  - Track material access statistics
  - Update or delete materials

- **Assignments**
  - Create assignments with descriptions and deadlines
  - Set maximum scores and grading rubrics
  - Attach materials and resources
  - Define assignment types (individual/group)
  - Schedule assignment releases

- **Student Groups**
  - Create and manage student groups
  - Assign students to groups
  - Track group performance
  - Manage group enrollments

#### 📊 Assessment & Grading
- **AI-Powered Grading** 🤖 **NEW!**
  - Automatic grading using OpenAI GPT-4o or Azure OpenAI
  - Two modes: Assisted (teacher approval) or Automatic
  - Uses assignment rubrics for detailed evaluation
  - Generates constructive feedback in Finnish
  - Provides confidence scores and reasoning
  - Configurable AI provider and model selection
  - Transparent AI attribution (optional)

- **Submission Review**
  - View all student submissions
  - Download submitted files
  - Provide inline comments
  - Grade with rubric support
  - Track grading history

- **Statistics & Reports**
  - Course completion rates
  - Assignment submission statistics
  - Grade distributions
  - Student activity reports
  - Export data for analysis

#### 🔔 Communication
- **Notifications**
  - Automatic notifications for new submissions
  - Reminders for upcoming deadlines
  - Real-time updates via SignalR
  - Email notifications (optional)

### For Students

#### 📖 Learning
- **Course Access**
  - Browse available courses
  - Enroll in courses
  - View course materials
  - Download course resources
  - Track course progress

- **Assignments**
  - View assigned tasks
  - Check deadlines and requirements
  - Upload submissions
  - Edit submissions before deadline
  - View grades and feedback

- **Progress Tracking**
  - View personal statistics
  - Check grades for all courses
  - Monitor assignment completion
  - Track performance trends

#### 💬 Feedback
- **Inline Comments**
  - Receive detailed feedback
  - View teacher comments
  - Understand grading criteria
  - Learn from mistakes

### For Administrators

#### 👥 User Management
- **Account Administration**
  - Create/edit/delete user accounts
  - Assign roles (Admin, Teacher, Student)
  - Manage user permissions
  - Reset passwords
  - View user activity

- **System Configuration**
  - Configure system settings
  - Manage integrations
  - Monitor system health
  - View audit logs

## User Roles

### 👨‍🎓 Student
**Capabilities:**
- Enroll in courses
- Access course materials
- Submit assignments
- View grades and feedback
- Participate in groups
- Receive notifications

**Restrictions:**
- Cannot create courses
- Cannot grade assignments
- Cannot manage other users
- Cannot access admin features

### 👨‍🏫 Teacher
**Capabilities:**
- All student capabilities
- Create and manage courses
- Upload course materials
- Create and grade assignments
- Manage student groups
- View course statistics
- Send notifications to students

**Restrictions:**
- Cannot manage system settings
- Cannot create/delete users (except from their courses)
- Cannot access other teachers' courses (unless added)

### 👨‍💼 Administrator
**Capabilities:**
- All teacher capabilities
- Full user management
- Access all courses
- System configuration
- View all statistics
- Manage system settings
- View audit logs

## Getting Started

### Quick Start for Students

1. **Login**
   - Navigate to the application URL
   - Enter your username and password
   - Click "Kirjaudu sisään" (Login)

2. **Browse Courses**
   - Go to "Kurssit" (Courses) from the navigation
   - Browse available courses
   - Click on a course to view details

3. **Enroll in a Course**
   - Open the course details
   - Click "Liity kurssille" (Join Course)
   - Confirm enrollment

4. **Access Materials**
   - Open your enrolled course
   - Go to "Materiaalit" (Materials) tab
   - Download or view materials

5. **Submit Assignments**
   - Go to "Tehtävät" (Assignments) tab
   - Click on an assignment
   - Upload your submission
   - Click "Lähetä" (Submit)

6. **Check Grades**
   - Go to "Profiili" (Profile)
   - View your grades and statistics
   - Check assignment feedback

### Quick Start for Teachers

1. **Create a Course**
   - Go to "Kurssit" → "Omat kurssit" (My Courses)
   - Click "+ Luo uusi kurssi" (Create New Course)
   - Fill in course details:
     - Name
     - Description
     - Start/End dates
   - Click "Tallenna" (Save)

2. **Add Materials**
   - Open your course
   - Go to "Materiaalit" tab
   - Click "+ Lisää materiaali" (Add Material)
   - Upload file or enter content
   - Click "Tallenna"

3. **Create Assignments**
   - Go to "Tehtävät" tab
   - Click "+ Lisää tehtävä" (Add Assignment)
   - Set:
     - Title and description
     - Due date
     - Maximum score
     - Grading rubric (optional)
   - Click "Tallenna"

4. **Create Groups**
   - Go to "Ryhmät" (Groups) tab
   - Click "+ Lisää ryhmä" (Add Group)
   - Name the group
   - Add students
   - Click "Tallenna"

5. **Grade Submissions**
   - Go to "Tehtävät" → Select assignment
   - Click on a submission
   - Review the submitted work
   - Provide feedback with inline comments
   - Enter grade
   - Click "Tallenna arviointi" (Save Grade)

6. **View Statistics**
   - Go to "Tilastot" (Statistics) tab
   - View course completion rates
   - Check assignment statistics
   - Export data if needed

## Technical Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **UI Library:** Material-UI (MUI) v5
- **State Management:** Redux Toolkit
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **Real-time:** SignalR
- **Build Tool:** Vite
- **Code Quality:** ESLint, TypeScript strict mode

### Backend
- **Framework:** ASP.NET Core 8.0 (C#)
- **Architecture:** Clean Architecture with SOLID principles
- **Authentication:** JWT with ASP.NET Core Identity
- **Database:** SQL Server with Entity Framework Core
- **File Storage:** Azure Blob Storage
- **Real-time:** SignalR
- **API Documentation:** Swagger/OpenAPI
- **Logging:** ILogger with structured logging

### Infrastructure
- **Hosting:** Azure App Service
- **Database:** Azure SQL Database
- **Storage:** Azure Blob Storage
- **CDN:** Azure CDN (optional)
- **CI/CD:** GitHub Actions / Azure DevOps

## Installation

### Prerequisites
- **Backend:**
  - .NET 8.0 SDK
  - SQL Server 2019+ or Azure SQL Database
  - Azure Storage Account (for file uploads)

- **Frontend:**
  - Node.js 18+
  - npm or yarn

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd TehtavaApp/Backend/TehtavaApp.API
```

2. **Configure Database**
```bash
# Update connection string in appsettings.json or appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TehtavaApp;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

3. **Configure Azure Storage**
```json
{
  "Storage": {
    "Azure": {
      "ConnectionString": "your-azure-storage-connection-string",
      "ContainerName": "uploads"
    }
  }
}
```

4. **Run Migrations**
```bash
dotnet ef database update
```

5. **Start the Backend**
```bash
dotnet run
```
Backend will run on `http://localhost:5001`

### Frontend Setup

1. **Navigate to Frontend**
```bash
cd Frontend/tehtavaappfrontend
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure API URL**
Create `.env` file:
```env
VITE_API_URL=http://localhost:5001/api
```

4. **Start the Frontend**
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

### Default Admin Account

The system automatically creates an admin account on first run:
- **Email:** admin@tehtavaapp.com
- **Password:** Admin123!

**⚠️ Important:** Change this password immediately after first login!

## Configuration

### Environment Variables

**Backend (appsettings.json):**
```json
{
  "Jwt": {
    "Key": "your-secret-key-at-least-32-characters",
    "Issuer": "TehtavaApp",
    "Audience": "TehtavaApp"
  },
  "Storage": {
    "Azure": {
      "ConnectionString": "azure-storage-connection-string",
      "ContainerName": "uploads"
    }
  },
  "AdminUser": {
    "Email": "admin@tehtavaapp.com",
    "Password": "Admin123!"
  }
}
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5001/api
```

### Database Configuration

The system uses SQL Server with Entity Framework Core. Default configuration:
- Connection string: `appsettings.json`
- Migrations: Automatic on startup
- Seeding: Admin user and roles

### AI Grading Configuration

Configure AI-powered grading in `appsettings.json`:

**OpenAI Setup:**
```json
{
  "AIGrading": {
    "Enabled": true,
    "Provider": "OpenAI",
    "Mode": "Assisted",
    "MarkAsAIGenerated": true,
    "OpenAI": {
      "ApiKey": "your-openai-api-key",
      "Model": "gpt-4o",
      "MaxTokens": 2000
    }
  }
}
```

**Azure OpenAI Setup:**
```json
{
  "AIGrading": {
    "Enabled": true,
    "Provider": "AzureOpenAI",
    "Mode": "Assisted",
    "MarkAsAIGenerated": true,
    "AzureOpenAI": {
      "Endpoint": "https://your-resource.openai.azure.com",
      "ApiKey": "your-azure-api-key",
      "DeploymentName": "your-deployment-name",
      "ApiVersion": "2024-02-15-preview"
    }
  }
}
```

**⚠️ Security Best Practices:**
- **Development**: Use User Secrets for API keys
  ```bash
  dotnet user-secrets set "AIGrading:OpenAI:ApiKey" "your-key"
  ```
- **Production**: Use Azure Key Vault or Environment Variables
- **Never** commit API keys to version control
- Add `appsettings.json` to `.gitignore`

**Configuration Options:**
- `Enabled`: Enable/disable AI grading
- `Provider`: "OpenAI" or "AzureOpenAI"
- `Mode`: "Assisted" (teacher approval) or "Automatic"
- `MarkAsAIGenerated`: Show AI attribution to students
- `Model`: AI model to use (e.g., "gpt-4o", "gpt-4-turbo")
- `MaxTokens`: Maximum response length (default: 2000)

**Admin Panel:**
Administrators can also configure AI settings through the web interface:
1. Login as Admin
2. Navigate to Admin Panel → AI Grading Settings
3. Configure provider and credentials
4. Test connection
5. Save settings

## API Documentation

### Authentication Endpoints

```http
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Course Endpoints

```http
GET    /api/course              # Get all courses
GET    /api/course/{id}         # Get course by ID
POST   /api/course              # Create course
PUT    /api/course/{id}         # Update course
DELETE /api/course/{id}         # Delete course
```

### Material Endpoints

```http
GET    /api/material                    # Search materials
GET    /api/material/{id}               # Get material
GET    /api/material/course/{courseId}  # Get course materials
POST   /api/material                    # Upload material
POST   /api/material/bulk-upload        # Bulk upload
PUT    /api/material/{id}               # Update material
DELETE /api/material/{id}               # Delete material
```

### Assignment Endpoints

```http
GET    /api/assignment                  # Get all assignments
GET    /api/assignment/{id}             # Get assignment
POST   /api/assignment                  # Create assignment
PUT    /api/assignment/{id}             # Update assignment
DELETE /api/assignment/{id}             # Delete assignment
GET    /api/assignment/{id}/submissions # Get submissions
POST   /api/assignment/{id}/submit      # Submit assignment
```

**Full API Documentation:** Available at `/swagger` when running in development mode.

## Usage Examples

### Student Workflow

```
1. Login → Dashboard
2. Navigate to "Kurssit" (Courses)
3. Browse and enroll in a course
4. View "Materiaalit" (Materials)
5. Download/view materials
6. Go to "Tehtävät" (Assignments)
7. Select assignment and upload file
8. Check "Profiili" for grades
```

### Teacher Workflow

```
1. Login → Dashboard
2. Navigate to "Omat kurssit" (My Courses)
3. Create new course
4. Add materials via "Materiaalit" tab
5. Create assignments via "Tehtävät" tab
6. Organize students into "Ryhmät" (Groups)
7. Review submissions and provide grades
8. Monitor progress in "Tilastot" (Statistics)
```

## Features in Detail

### File Upload Support

**Supported File Types:**
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Images: JPG, PNG, GIF, WEBP
- Text: TXT, MD, HTML

**File Size Limits:**
- Individual files: 100 MB
- Bulk upload: 100 MB per file

### Grading System

**Features:**
- Numerical grades (0-5 Finnish scale)
- Rubric-based grading
- Inline comments
- Grading history
- Grade statistics
- Export capabilities

#### 🤖 AI-Powered Grading (NEW!)

**Overview:**
TehtavaApp now includes intelligent AI-powered grading capabilities that assist teachers in evaluating student submissions quickly and consistently.

**Supported AI Providers:**
- **OpenAI** - GPT-4o, GPT-4-turbo
- **Azure OpenAI** - Enterprise-grade with custom deployments

**Operating Modes:**
1. **Assisted Mode** (Recommended)
   - AI generates grading suggestions
   - Teacher reviews and can modify before applying
   - Full control over final grades
   - Learn from AI's reasoning

2. **Automatic Mode**
   - AI grades are applied directly
   - Teacher can review afterwards
   - Faster for large volumes
   - Configurable confidence thresholds

**How It Works:**
1. Teacher opens a student submission
2. Clicks "Generate AI Grading Suggestion"
3. AI analyzes:
   - Assignment description and requirements
   - Grading rubric (if defined)
   - Student's submission content
4. AI provides:
   - Grade (0-5 scale)
   - Detailed constructive feedback in Finnish
   - Reasoning for the grade
   - Confidence score (0-100%)
   - Scores per rubric criterion (if applicable)
5. Teacher can:
   - ✅ Accept the suggestion as-is
   - ✏️ Modify grade or feedback
   - ❌ Reject and grade manually

**Benefits:**
- ⚡ **Speed**: Grade assignments in seconds
- 🎯 **Consistency**: Same criteria applied to all submissions
- 📝 **Quality Feedback**: Detailed, constructive comments
- 🔍 **Transparency**: See AI's reasoning and confidence level
- 📊 **Rubric Support**: Evaluates against defined criteria
- 🌐 **Finnish Language**: Feedback generated in Finnish
- 🔒 **Privacy**: Optional AI attribution marking

**Configuration:**
Administrators can configure AI grading through the admin panel:
- Enable/disable AI grading
- Choose AI provider (OpenAI or Azure OpenAI)
- Set operating mode (Assisted or Automatic)
- Configure API keys and model settings
- Toggle AI attribution visibility
- Test connection before use

**Cost Efficiency:**
- Average cost: ~€0.008 per assignment (less than 1 cent)
- Significant time savings for teachers
- Scales to any number of submissions

**Security & Privacy:**
- API keys stored securely (User Secrets / Azure Key Vault)
- Metadata tracked for transparency
- GDPR compliant
- Optional marking of AI-graded submissions

### Notification System

**Notification Types:**
- New materials
- New assignments
- Assignment deadlines
- Grades published
- Course updates
- Group activities

**Delivery Methods:**
- In-app notifications
- Real-time updates (SignalR)
- Email notifications (optional)

## Security

### Authentication
- JWT-based authentication
- Secure password hashing (ASP.NET Core Identity)
- Token expiration and refresh
- Role-based access control

### Authorization
- Role-based permissions (Admin, Teacher, Student)
- Course-level permissions
- Resource-level access control
- API endpoint protection

### Data Protection
- HTTPS required in production
- SQL injection prevention (EF Core)
- XSS protection
- CSRF protection
- File upload validation
- Secure file storage (Azure Blob)

## Performance

### Optimizations
- Frontend caching (5-minute TTL)
- Lazy loading of components
- Code splitting
- Image optimization
- Database query optimization
- CDN for static assets

### Scalability
- Stateless API design
- Azure auto-scaling
- Database connection pooling
- Blob storage for files
- SignalR backplane (Redis)

## Troubleshooting

### Common Issues

**Issue: Cannot login**
- Check credentials
- Verify database connection
- Check JWT configuration
- Clear browser cache/cookies

**Issue: File upload fails**
- Check file size (max 100MB)
- Verify file type is supported
- Check Azure Storage connection
- Verify storage container exists

**Issue: Notifications not working**
- Check SignalR connection
- Verify WebSocket support
- Check firewall settings
- Clear browser cache

**Issue: Slow performance**
- Clear frontend cache
- Check network connection
- Verify database performance
- Check Azure resource limits

## Support

### Getting Help
- **Documentation:** This README and SOLID_REFACTORING.md
- **API Docs:** `/swagger` endpoint
- **Issues:** GitHub Issues (if applicable)

### Reporting Bugs
When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/environment details
- Screenshots (if applicable)

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- Follow SOLID principles
- Write unit tests
- Use TypeScript/C# type safety
- Follow existing code style
- Document new features

## License

[Specify your license here]

## Changelog

### Version 1.0.0 (Current)
- ✅ Course management
- ✅ Material distribution
- ✅ Assignment system
- ✅ Grading with rubrics
- ✅ Group management
- ✅ Real-time notifications
- ✅ SOLID refactoring completed
- ✅ Performance optimizations

---

# Suomi

## 📖 Sisällysluettelo
1. [Yleiskatsaus](#yleiskatsaus)
2. [Ominaisuudet](#ominaisuudet)
3. [Käyttäjäroolit](#käyttäjäroolit)
4. [Aloitus](#aloitus)
5. [Käyttöohje](#käyttöohje)
6. [Tekninen toteutus](#tekninen-toteutus)
7. [Asennus](#asennus)
8. [Konfigurointi](#konfigurointi)
9. [API-dokumentaatio](#api-dokumentaatio)
10. [Osallistuminen](#osallistuminen)

## Yleiskatsaus

**TehtavaApp** on kattava verkkopohjainen tehtävien- ja kurssinhallintajärjestelmä oppilaitoksille. Se mahdollistaa opettajien luoda kursseja, hallita materiaaleja, antaa tehtäviä ja seurata opiskelijoiden edistymistä, samalla tarjoten opiskelijoille intuitiivisen käyttöliittymän kurssimateriaalien käyttöön, tehtävien palauttamiseen ja suorituksen seuraamiseen.

### Keskeiset ominaisuudet
- 📚 **Kurssinhallinta** - Luo ja hallitse kursseja materiaaleineen ja tehtävineen
- 👥 **Ryhmähallinta** - Järjestä opiskelijat ryhmiin yhteistyötä varten
- 📝 **Tehtäväjärjestelmä** - Luo, anna ja arvioi tehtäviä rubriikkien avulla
- 🤖 **Tekoälypohjainen arviointi** - Automaattinen tehtävien arviointi OpenAI:lla tai Azure OpenAI:lla
- 📄 **Materiaalien jakelu** - Lataa ja jaa kurssimateriaalia (PDF, dokumentit, kuvat)
- 📊 **Edistymisen seuranta** - Seuraa opiskelijoiden suoriutumista ja luo tilastoja
- 🔔 **Reaaliaikaiset ilmoitukset** - Pysy ajan tasalla kurssiaktiviteeteista
- 💬 **Riviviestit** - Anna yksityiskohtaista palautetta palautuksiin
- 🎯 **Arviointijärjestelmä** - Kattava arviointi rubriikkeineen ja historioineen

## Ominaisuudet

### Opettajille

#### 📚 Kurssinhallinta
- **Kurssien luominen**
  - Aseta kurssin nimi, kuvaus, alku-/loppupäivät
  - Määrittele kurssirakenne ja tavoitteet
  - Aktivoi/deaktivoi kurssit
  - Lisää useita opettajia kurssille

- **Kurssimateriaalit**
  - Lataa tiedostoja (PDF, Word, Excel, PowerPoint, kuvat)
  - Järjestä materiaalit aihealueittain
  - Massalataa useita materiaaleja
  - Seuraa materiaalien käyttötilastoja
  - Päivitä tai poista materiaaleja

- **Tehtävät**
  - Luo tehtäviä kuvauksilla ja määräaikoina
  - Aseta maksimipistemäärät ja arviointirubrikit
  - Liitä materiaaleja ja resursseja
  - Määrittele tehtävätyypit (yksilö/ryhmä)
  - Ajasta tehtävien julkaisut

- **Opiskelijaryhmät**
  - Luo ja hallitse opiskelijaryhmiä
  - Jaa opiskelijat ryhmiin
  - Seuraa ryhmien suoriutumista
  - Hallitse ryhmäilmoittautumisia

#### 📊 Arviointi ja arvostelu
- **Tekoälypohjainen arviointi** 🤖 **UUSI!**
  - Automaattinen arviointi OpenAI GPT-4o:lla tai Azure OpenAI:lla
  - Kaksi tilaa: Avustettu (opettaja hyväksyy) tai Automaattinen
  - Käyttää tehtävän rubriikkia yksityiskohtaiseen arviointiin
  - Luo rakentavaa palautetta suomeksi
  - Tarjoaa luotettavuuspisteet ja perustelut
  - Konfiguroitava AI-palveluntarjoaja ja malli
  - Läpinäkyvä AI-merkintä (valinnainen)

- **Palautusten tarkastelu**
  - Katso kaikki opiskelijoiden palautukset
  - Lataa palautetut tiedostot
  - Anna riviviestejä
  - Arvioi rubriikkien tuella
  - Seuraa arviointihistoriaa

- **Tilastot ja raportit**
  - Kurssin suoritusasteet
  - Tehtävien palautustilastot
  - Arvosanajakaumat
  - Opiskelijoiden aktiivisuusraportit
  - Vie dataa analysointia varten

#### 🔔 Viestintä
- **Ilmoitukset**
  - Automaattiset ilmoitukset uusista palautuksista
  - Muistutukset tulevista määräajoista
  - Reaaliaikaiset päivitykset SignalR:n kautta
  - Sähköposti-ilmoitukset (valinnainen)

### Opiskelijoille

#### 📖 Oppiminen
- **Kurssipääsy**
  - Selaa saatavilla olevia kursseja
  - Ilmoittaudu kursseille
  - Katso kurssimateriaaleja
  - Lataa kurssiresursseja
  - Seuraa kurssin edistymistä

- **Tehtävät**
  - Katso annetut tehtävät
  - Tarkista määräajat ja vaatimukset
  - Lataa palautuksia
  - Muokkaa palautuksia ennen määräaikaa
  - Katso arvosanat ja palaute

- **Edistymisen seuranta**
  - Katso henkilökohtaiset tilastot
  - Tarkista arvosanat kaikille kursseille
  - Seuraa tehtävien suoritusta
  - Seuraa suorituskehitystä

#### 💬 Palaute
- **Riviviestit**
  - Vastaanota yksityiskohtaista palautetta
  - Katso opettajan kommentit
  - Ymmärrä arviointikriteerit
  - Opi virheistä

### Ylläpitäjille

#### 👥 Käyttäjähallinta
- **Tilienhallinta**
  - Luo/muokkaa/poista käyttäjätilejä
  - Määritä roolit (Ylläpitäjä, Opettaja, Opiskelija)
  - Hallitse käyttöoikeuksia
  - Nollaa salasanoja
  - Katso käyttäjien aktiivisuutta

- **Järjestelmän konfigurointi**
  - Määritä järjestelmän asetukset
  - Hallitse integraatioita
  - Seuraa järjestelmän tilaa
  - Katso auditointilokeja

## Käyttäjäroolit

### 👨‍🎓 Opiskelija
**Valtuudet:**
- Ilmoittaudu kursseille
- Käytä kurssimateriaalia
- Palauta tehtäviä
- Katso arvosanat ja palaute
- Osallistu ryhmiin
- Vastaanota ilmoituksia

**Rajoitukset:**
- Ei voi luoda kursseja
- Ei voi arvioida tehtäviä
- Ei voi hallita muita käyttäjiä
- Ei pääsyä ylläpitoominaisuuksiin

### 👨‍🏫 Opettaja
**Valtuudet:**
- Kaikki opiskelijan valtuudet
- Luo ja hallitse kursseja
- Lataa kurssimateriaaleja
- Luo ja arvioi tehtäviä
- Hallitse opiskelijaryhmiä
- Katso kurssitilastoja
- Lähetä ilmoituksia opiskelijoille

**Rajoitukset:**
- Ei voi hallita järjestelmäasetuksia
- Ei voi luoda/poistaa käyttäjiä (paitsi omilta kursseilta)
- Ei pääsyä muiden opettajien kursseihin (ellei lisätty)

### 👨‍💼 Ylläpitäjä
**Valtuudet:**
- Kaikki opettajan valtuudet
- Täysi käyttäjähallinta
- Pääsy kaikkiin kursseihin
- Järjestelmän konfigurointi
- Kaikkien tilastojen katselu
- Hallitse järjestelmäasetuksia
- Katso auditointilokeja

## Aloitus

### Pika-aloitus opiskelijoille

1. **Kirjaudu sisään**
   - Siirry sovelluksen URL-osoitteeseen
   - Syötä käyttäjätunnus ja salasana
   - Klikkaa "Kirjaudu sisään"

2. **Selaa kursseja**
   - Mene navigaatiosta kohtaan "Kurssit"
   - Selaa saatavilla olevia kursseja
   - Klikkaa kurssia nähdäksesi tiedot

3. **Liity kurssille**
   - Avaa kurssin tiedot
   - Klikkaa "Liity kurssille"
   - Vahvista ilmoittautuminen

4. **Käytä materiaaleja**
   - Avaa ilmoittautunut kurssisi
   - Mene "Materiaalit"-välilehdelle
   - Lataa tai katso materiaaleja

5. **Palauta tehtäviä**
   - Mene "Tehtävät"-välilehdelle
   - Klikkaa tehtävää
   - Lataa palautuksesi
   - Klikkaa "Lähetä"

6. **Tarkista arvosanat**
   - Mene kohtaan "Profiili"
   - Katso arvosanasi ja tilastosi
   - Tarkista tehtävien palaute

### Pika-aloitus opettajille

1. **Luo kurssi**
   - Mene "Kurssit" → "Omat kurssit"
   - Klikkaa "+ Luo uusi kurssi"
   - Täytä kurssin tiedot:
     - Nimi
     - Kuvaus
     - Alku-/loppupäivät
   - Klikkaa "Tallenna"

2. **Lisää materiaaleja**
   - Avaa kurssisi
   - Mene "Materiaalit"-välilehdelle
   - Klikkaa "+ Lisää materiaali"
   - Lataa tiedosto tai syötä sisältö
   - Klikkaa "Tallenna"

3. **Luo tehtäviä**
   - Mene "Tehtävät"-välilehdelle
   - Klikkaa "+ Lisää tehtävä"
   - Aseta:
     - Otsikko ja kuvaus
     - Määräaika
     - Maksimipisteet
     - Arviointirubiikki (valinnainen)
   - Klikkaa "Tallenna"

4. **Luo ryhmiä**
   - Mene "Ryhmät"-välilehdelle
   - Klikkaa "+ Lisää ryhmä"
   - Nimeä ryhmä
   - Lisää opiskelijoita
   - Klikkaa "Tallenna"

5. **Arvioi palautukset**
   - Mene "Tehtävät" → Valitse tehtävä
   - Klikkaa palautusta
   - Tarkista palautettu työ
   - Anna palautetta riviviesteillä
   - Syötä arvosana
   - Klikkaa "Tallenna arviointi"

6. **Katso tilastoja**
   - Mene "Tilastot"-välilehdelle
   - Katso kurssin suoritusasteita
   - Tarkista tehtävätilastot
   - Vie tietoja tarvittaessa

## Tekninen toteutus

### Frontend
- **Kehys:** React 18 TypeScriptin kanssa
- **UI-kirjasto:** Material-UI (MUI) v5
- **Tilan hallinta:** Redux Toolkit
- **Reititys:** React Router v6
- **HTTP-asiakas:** Axios
- **Reaaliaikainen:** SignalR
- **Build-työkalu:** Vite
- **Koodin laatu:** ESLint, TypeScript strict mode

### Backend
- **Kehys:** ASP.NET Core 8.0 (C#)
- **Arkkitehtuuri:** Clean Architecture SOLID-periaattein
- **Autentikointi:** JWT ASP.NET Core Identityn kanssa
- **Tietokanta:** SQL Server Entity Framework Coren kanssa
- **Tiedostojen tallennus:** Azure Blob Storage
- **Reaaliaikainen:** SignalR
- **API-dokumentaatio:** Swagger/OpenAPI
- **Lokitus:** ILogger strukturoidulla lokituksella

### Infrastruktuuri
- **Isännöinti:** Azure App Service
- **Tietokanta:** Azure SQL Database
- **Tallennus:** Azure Blob Storage
- **CDN:** Azure CDN (valinnainen)
- **CI/CD:** GitHub Actions / Azure DevOps

## Asennus

### Edellytykset
- **Backend:**
  - .NET 8.0 SDK
  - SQL Server 2019+ tai Azure SQL Database
  - Azure Storage -tili (tiedostojen lataukseen)

- **Frontend:**
  - Node.js 18+
  - npm tai yarn

### Backend-asennus

1. **Kloonaa repositorio**
```bash
git clone <repository-url>
cd TehtavaApp/Backend/TehtavaApp.API
```

2. **Konfiguroi tietokanta**
```bash
# Päivitä yhteysmerkkijono appsettings.json- tai appsettings.Development.json-tiedostossa
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=TehtavaApp;Trusted_Connection=True;TrustServerCertificate=True"
  }
}
```

3. **Konfiguroi Azure Storage**
```json
{
  "Storage": {
    "Azure": {
      "ConnectionString": "azure-storage-yhteysmerkkijono",
      "ContainerName": "uploads"
    }
  }
}
```

4. **Suorita migraatiot**
```bash
dotnet ef database update
```

5. **Käynnistä backend**
```bash
dotnet run
```
Backend toimii osoitteessa `http://localhost:5001`

### Frontend-asennus

1. **Siirry frontendiin**
```bash
cd Frontend/tehtavaappfrontend
```

2. **Asenna riippuvuudet**
```bash
npm install
```

3. **Konfiguroi API URL**
Luo `.env`-tiedosto:
```env
VITE_API_URL=http://localhost:5001/api
```

4. **Käynnistä frontend**
```bash
npm run dev
```
Frontend toimii osoitteessa `http://localhost:5173`

### Oletus ylläpitäjätili

Järjestelmä luo automaattisesti ylläpitäjätilin ensimmäisellä käynnistyskerralla:
- **Sähköposti:** admin@tehtavaapp.com
- **Salasana:** Admin123!

**⚠️ Tärkeää:** Vaihda tämä salasana heti ensimmäisen kirjautumisen jälkeen!

## Tuki

### Apu
- **Dokumentaatio:** Tämä README ja SOLID_REFACTORING.md
- **API-dokumentaatio:** `/swagger`-päätepiste
- **Ongelmat:** GitHub Issues (jos käytettävissä)

### Virheiden raportointi
Raportoidessasi virheitä, sisällytä:
- Vaiheet toistamiseen
- Odotettu toiminta
- Todellinen toiminta
- Selain-/ympäristötiedot
- Kuvakaappaukset (jos mahdollista)

## Lisenssi

[Määritä lisenssisi tähän]

## Muutosloki

### Versio 1.1.0 (Uusin) 🎉
- 🤖 **UUSI: Tekoälypohjainen arviointi**
  - OpenAI ja Azure OpenAI -integraatiot
  - Avustettu ja automaattinen arviointitila
  - Rubriikkipohjainen arviointi
  - Suomenkielinen palaute
  - Admin-paneeli AI-asetusten hallintaan
  - Läpinäkyvä metadata ja luottamuspisteet

### Versio 1.0.0
- ✅ Kurssinhallinta
- ✅ Materiaalien jakelu
- ✅ Tehtäväjärjestelmä
- ✅ Arviointi rubriikkeineen
- ✅ Ryhmähallinta
- ✅ Reaaliaikaiset ilmoitukset
- ✅ SOLID-refaktorointi valmis
- ✅ Suorituskykyoptimoinnit

---

**Päivitetty:** 2025-10-31  
**Versio:** 1.1.0 (🤖 AI-Powered Grading)  
**Tila:** Tuotantovalmis
