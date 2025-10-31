IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [AspNetRoles] (
    [Id] nvarchar(450) NOT NULL,
    [Name] nvarchar(256) NULL,
    [NormalizedName] nvarchar(256) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [AspNetUsers] (
    [Id] nvarchar(450) NOT NULL,
    [FirstName] nvarchar(max) NULL,
    [LastName] nvarchar(max) NULL,
    [Bio] nvarchar(max) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [PrimaryRole] nvarchar(max) NULL,
    [IsActive] bit NOT NULL,
    [UserName] nvarchar(256) NULL,
    [NormalizedUserName] nvarchar(256) NULL,
    [Email] nvarchar(256) NULL,
    [NormalizedEmail] nvarchar(256) NULL,
    [EmailConfirmed] bit NOT NULL,
    [PasswordHash] nvarchar(max) NULL,
    [SecurityStamp] nvarchar(max) NULL,
    [ConcurrencyStamp] nvarchar(max) NULL,
    [PhoneNumber] nvarchar(max) NULL,
    [PhoneNumberConfirmed] bit NOT NULL,
    [TwoFactorEnabled] bit NOT NULL,
    [LockoutEnd] datetimeoffset NULL,
    [LockoutEnabled] bit NOT NULL,
    [AccessFailedCount] int NOT NULL,
    CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
);
GO

CREATE TABLE [AspNetRoleClaims] (
    [Id] int NOT NULL IDENTITY,
    [RoleId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AspNetUserClaims] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [ClaimType] nvarchar(max) NULL,
    [ClaimValue] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AspNetUserLogins] (
    [LoginProvider] nvarchar(450) NOT NULL,
    [ProviderKey] nvarchar(450) NOT NULL,
    [ProviderDisplayName] nvarchar(max) NULL,
    [UserId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
    CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AspNetUserRoles] (
    [UserId] nvarchar(450) NOT NULL,
    [RoleId] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
    CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AspNetUserTokens] (
    [UserId] nvarchar(450) NOT NULL,
    [LoginProvider] nvarchar(450) NOT NULL,
    [Name] nvarchar(450) NOT NULL,
    [Value] nvarchar(max) NULL,
    CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
    CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Courses] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [TeacherId] nvarchar(450) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_Courses] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Courses_AspNetUsers_TeacherId] FOREIGN KEY ([TeacherId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [NotificationPreferences] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [Type] int NOT NULL,
    [Channel] int NOT NULL,
    [IsEnabled] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_NotificationPreferences] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NotificationPreferences_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [SchoolGroups] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [CreatedById] nvarchar(450) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsActive] bit NOT NULL,
    CONSTRAINT [PK_SchoolGroups] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SchoolGroups_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION
);
GO

CREATE TABLE [Assignments] (
    [Id] int NOT NULL IDENTITY,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [DueDate] datetime2 NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [CourseId] int NOT NULL,
    [CreatedById] nvarchar(450) NOT NULL,
    CONSTRAINT [PK_Assignments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Assignments_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Assignments_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Materials] (
    [Id] int NOT NULL IDENTITY,
    [Title] nvarchar(max) NOT NULL,
    [Description] nvarchar(max) NOT NULL,
    [Content] nvarchar(max) NOT NULL,
    [Type] nvarchar(max) NOT NULL,
    [FileUrl] nvarchar(max) NOT NULL,
    [FileType] nvarchar(max) NOT NULL,
    [FileSize] bigint NOT NULL,
    [FilePath] nvarchar(max) NOT NULL,
    [ContentType] nvarchar(max) NOT NULL,
    [CreatedById] nvarchar(450) NOT NULL,
    [CourseId] int NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    CONSTRAINT [PK_Materials] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Materials_AspNetUsers_CreatedById] FOREIGN KEY ([CreatedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Materials_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]) ON DELETE SET NULL
);
GO

CREATE TABLE [StudentCourseEnrollments] (
    [Id] int NOT NULL IDENTITY,
    [StudentId] nvarchar(450) NOT NULL,
    [CourseId] int NOT NULL,
    [Status] int NOT NULL,
    [EnrolledAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_StudentCourseEnrollments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_StudentCourseEnrollments_AspNetUsers_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_StudentCourseEnrollments_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [CourseSchoolGroup] (
    [CoursesId] int NOT NULL,
    [GroupsId] int NOT NULL,
    CONSTRAINT [PK_CourseSchoolGroup] PRIMARY KEY ([CoursesId], [GroupsId]),
    CONSTRAINT [FK_CourseSchoolGroup_Courses_CoursesId] FOREIGN KEY ([CoursesId]) REFERENCES [Courses] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_CourseSchoolGroup_SchoolGroups_GroupsId] FOREIGN KEY ([GroupsId]) REFERENCES [SchoolGroups] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [Notifications] (
    [Id] int NOT NULL IDENTITY,
    [UserId] nvarchar(450) NOT NULL,
    [Title] nvarchar(max) NOT NULL,
    [Message] nvarchar(max) NOT NULL,
    [Type] int NOT NULL,
    [IsRead] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [ReadAt] datetime2 NULL,
    [RelatedId] int NULL,
    [CourseId] int NULL,
    [GroupId] int NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Notifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_Notifications_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]),
    CONSTRAINT [FK_Notifications_SchoolGroups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [SchoolGroups] ([Id])
);
GO

CREATE TABLE [StudentGroupEnrollments] (
    [Id] int NOT NULL IDENTITY,
    [StudentId] nvarchar(450) NOT NULL,
    [GroupId] int NOT NULL,
    [Status] int NOT NULL,
    [EnrolledAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NULL,
    CONSTRAINT [PK_StudentGroupEnrollments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_StudentGroupEnrollments_AspNetUsers_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_StudentGroupEnrollments_SchoolGroups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [SchoolGroups] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AssignmentSubmissions] (
    [Id] int NOT NULL IDENTITY,
    [AssignmentId] int NOT NULL,
    [StudentId] nvarchar(450) NOT NULL,
    [SubmissionText] nvarchar(max) NOT NULL,
    [Status] nvarchar(max) NOT NULL,
    [SubmittedAt] datetime2 NOT NULL,
    [GradedAt] datetime2 NULL,
    [Grade] nvarchar(max) NOT NULL,
    [FeedbackText] nvarchar(max) NOT NULL,
    [GradedById] nvarchar(450) NOT NULL,
    [AttemptNumber] int NOT NULL,
    [RequiresRevision] bit NOT NULL,
    CONSTRAINT [PK_AssignmentSubmissions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AssignmentSubmissions_AspNetUsers_GradedById] FOREIGN KEY ([GradedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_AssignmentSubmissions_AspNetUsers_StudentId] FOREIGN KEY ([StudentId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_AssignmentSubmissions_Assignments_AssignmentId] FOREIGN KEY ([AssignmentId]) REFERENCES [Assignments] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AssignmentMaterial] (
    [RelatedAssignmentsId] int NOT NULL,
    [RelatedMaterialsId] int NOT NULL,
    CONSTRAINT [PK_AssignmentMaterial] PRIMARY KEY ([RelatedAssignmentsId], [RelatedMaterialsId]),
    CONSTRAINT [FK_AssignmentMaterial_Assignments_RelatedAssignmentsId] FOREIGN KEY ([RelatedAssignmentsId]) REFERENCES [Assignments] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AssignmentMaterial_Materials_RelatedMaterialsId] FOREIGN KEY ([RelatedMaterialsId]) REFERENCES [Materials] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [NotificationMetadata] (
    [Id] int NOT NULL IDENTITY,
    [NotificationId] int NOT NULL,
    [Key] nvarchar(max) NOT NULL,
    [Value] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_NotificationMetadata] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_NotificationMetadata_Notifications_NotificationId] FOREIGN KEY ([NotificationId]) REFERENCES [Notifications] ([Id]) ON DELETE CASCADE
);
GO

CREATE TABLE [AssignmentSubmissionMaterial] (
    [SubmissionsId] int NOT NULL,
    [SubmittedMaterialsId] int NOT NULL,
    CONSTRAINT [PK_AssignmentSubmissionMaterial] PRIMARY KEY ([SubmissionsId], [SubmittedMaterialsId]),
    CONSTRAINT [FK_AssignmentSubmissionMaterial_AssignmentSubmissions_SubmissionsId] FOREIGN KEY ([SubmissionsId]) REFERENCES [AssignmentSubmissions] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_AssignmentSubmissionMaterial_Materials_SubmittedMaterialsId] FOREIGN KEY ([SubmittedMaterialsId]) REFERENCES [Materials] ([Id]) ON DELETE CASCADE
);
GO

CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
GO

CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL;
GO

CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
GO

CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
GO

CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
GO

CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
GO

CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL;
GO

CREATE INDEX [IX_AssignmentMaterial_RelatedMaterialsId] ON [AssignmentMaterial] ([RelatedMaterialsId]);
GO

CREATE INDEX [IX_Assignments_CourseId] ON [Assignments] ([CourseId]);
GO

CREATE INDEX [IX_Assignments_CreatedById] ON [Assignments] ([CreatedById]);
GO

CREATE INDEX [IX_AssignmentSubmissionMaterial_SubmittedMaterialsId] ON [AssignmentSubmissionMaterial] ([SubmittedMaterialsId]);
GO

CREATE INDEX [IX_AssignmentSubmissions_AssignmentId] ON [AssignmentSubmissions] ([AssignmentId]);
GO

CREATE INDEX [IX_AssignmentSubmissions_GradedById] ON [AssignmentSubmissions] ([GradedById]);
GO

CREATE INDEX [IX_AssignmentSubmissions_StudentId] ON [AssignmentSubmissions] ([StudentId]);
GO

CREATE INDEX [IX_Courses_TeacherId] ON [Courses] ([TeacherId]);
GO

CREATE INDEX [IX_CourseSchoolGroup_GroupsId] ON [CourseSchoolGroup] ([GroupsId]);
GO

CREATE INDEX [IX_Materials_CourseId] ON [Materials] ([CourseId]);
GO

CREATE INDEX [IX_Materials_CreatedById] ON [Materials] ([CreatedById]);
GO

CREATE INDEX [IX_NotificationMetadata_NotificationId] ON [NotificationMetadata] ([NotificationId]);
GO

CREATE INDEX [IX_NotificationPreferences_UserId] ON [NotificationPreferences] ([UserId]);
GO

CREATE INDEX [IX_Notifications_CourseId] ON [Notifications] ([CourseId]);
GO

CREATE INDEX [IX_Notifications_GroupId] ON [Notifications] ([GroupId]);
GO

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);
GO

CREATE INDEX [IX_SchoolGroups_CreatedById] ON [SchoolGroups] ([CreatedById]);
GO

CREATE INDEX [IX_StudentCourseEnrollments_CourseId] ON [StudentCourseEnrollments] ([CourseId]);
GO

CREATE INDEX [IX_StudentCourseEnrollments_StudentId] ON [StudentCourseEnrollments] ([StudentId]);
GO

CREATE INDEX [IX_StudentGroupEnrollments_GroupId] ON [StudentGroupEnrollments] ([GroupId]);
GO

CREATE INDEX [IX_StudentGroupEnrollments_StudentId] ON [StudentGroupEnrollments] ([StudentId]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250223090643_InitialCreate', N'8.0.1');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250223125258_MigrationNimi', N'8.0.1');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

CREATE TABLE [SystemSettings] (
    [Id] int NOT NULL IDENTITY,
    [SettingName] nvarchar(max) NOT NULL,
    [SettingValue] nvarchar(max) NOT NULL,
    CONSTRAINT [PK_SystemSettings] PRIMARY KEY ([Id])
);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250224151900_AddSystemSettings', N'8.0.1');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Materials] ADD [AccessCount] int NOT NULL DEFAULT 0;
GO

ALTER TABLE [Courses] ADD [EndDate] datetime2 NULL;
GO

ALTER TABLE [Courses] ADD [StartDate] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
GO

DECLARE @var0 sysname;
SELECT @var0 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Assignments]') AND [c].[name] = N'Status');
IF @var0 IS NOT NULL EXEC(N'ALTER TABLE [Assignments] DROP CONSTRAINT [' + @var0 + '];');
ALTER TABLE [Assignments] ALTER COLUMN [Status] nvarchar(50) NOT NULL;
GO

ALTER TABLE [Assignments] ADD [FeedbackText] nvarchar(2000) NULL;
GO

ALTER TABLE [Assignments] ADD [Grade] nvarchar(50) NULL;
GO

ALTER TABLE [Assignments] ADD [GradedAt] datetime2 NULL;
GO

ALTER TABLE [Assignments] ADD [GradedById] nvarchar(450) NULL;
GO

ALTER TABLE [Assignments] ADD [RequiresRevision] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

ALTER TABLE [AspNetUsers] ADD [LastActive] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';
GO

CREATE INDEX [IX_Assignments_GradedById] ON [Assignments] ([GradedById]);
GO

ALTER TABLE [Assignments] ADD CONSTRAINT [FK_Assignments_AspNetUsers_GradedById] FOREIGN KEY ([GradedById]) REFERENCES [AspNetUsers] ([Id]) ON DELETE NO ACTION;
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250224210805_AddCourseAndUserDateProperties', N'8.0.1');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

DROP INDEX [IX_NotificationMetadata_NotificationId] ON [NotificationMetadata];
GO

DECLARE @var1 sysname;
SELECT @var1 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[NotificationMetadata]') AND [c].[name] = N'Key');
IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [NotificationMetadata] DROP CONSTRAINT [' + @var1 + '];');
ALTER TABLE [NotificationMetadata] DROP COLUMN [Key];
GO

DECLARE @var2 sysname;
SELECT @var2 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[NotificationMetadata]') AND [c].[name] = N'Value');
IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [NotificationMetadata] DROP CONSTRAINT [' + @var2 + '];');
ALTER TABLE [NotificationMetadata] DROP COLUMN [Value];
GO

DECLARE @var3 sysname;
SELECT @var3 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Assignments]') AND [c].[name] = N'GradedAt');
IF @var3 IS NOT NULL EXEC(N'ALTER TABLE [Assignments] DROP CONSTRAINT [' + @var3 + '];');
ALTER TABLE [Assignments] DROP COLUMN [GradedAt];
GO

ALTER TABLE [NotificationMetadata] ADD [AssignmentId] int NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [AssignmentTitle] nvarchar(max) NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [CourseId] int NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [CourseName] nvarchar(max) NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [DueDate] datetime2 NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [Grade] decimal(18,2) NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [GroupId] int NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [GroupName] nvarchar(max) NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [MaterialId] int NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [MaterialTitle] nvarchar(max) NULL;
GO

ALTER TABLE [NotificationMetadata] ADD [Url] nvarchar(max) NULL;
GO

DECLARE @var4 sysname;
SELECT @var4 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[AssignmentSubmissions]') AND [c].[name] = N'Status');
IF @var4 IS NOT NULL EXEC(N'ALTER TABLE [AssignmentSubmissions] DROP CONSTRAINT [' + @var4 + '];');
ALTER TABLE [AssignmentSubmissions] ALTER COLUMN [Status] int NOT NULL;
GO

DECLARE @var5 sysname;
SELECT @var5 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[AssignmentSubmissions]') AND [c].[name] = N'Grade');
IF @var5 IS NOT NULL EXEC(N'ALTER TABLE [AssignmentSubmissions] DROP CONSTRAINT [' + @var5 + '];');
ALTER TABLE [AssignmentSubmissions] ALTER COLUMN [Grade] float NULL;
GO

DECLARE @var6 sysname;
SELECT @var6 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Assignments]') AND [c].[name] = N'Status');
IF @var6 IS NOT NULL EXEC(N'ALTER TABLE [Assignments] DROP CONSTRAINT [' + @var6 + '];');
ALTER TABLE [Assignments] ALTER COLUMN [Status] int NOT NULL;
GO

DECLARE @var7 sysname;
SELECT @var7 = [d].[name]
FROM [sys].[default_constraints] [d]
INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Assignments]') AND [c].[name] = N'Grade');
IF @var7 IS NOT NULL EXEC(N'ALTER TABLE [Assignments] DROP CONSTRAINT [' + @var7 + '];');
ALTER TABLE [Assignments] ALTER COLUMN [Grade] float NULL;
GO

ALTER TABLE [Assignments] ADD [IsActive] bit NOT NULL DEFAULT CAST(0 AS bit);
GO

CREATE INDEX [IX_NotificationMetadata_AssignmentId] ON [NotificationMetadata] ([AssignmentId]);
GO

CREATE INDEX [IX_NotificationMetadata_CourseId] ON [NotificationMetadata] ([CourseId]);
GO

CREATE INDEX [IX_NotificationMetadata_GroupId] ON [NotificationMetadata] ([GroupId]);
GO

CREATE INDEX [IX_NotificationMetadata_MaterialId] ON [NotificationMetadata] ([MaterialId]);
GO

CREATE UNIQUE INDEX [IX_NotificationMetadata_NotificationId] ON [NotificationMetadata] ([NotificationId]);
GO

ALTER TABLE [NotificationMetadata] ADD CONSTRAINT [FK_NotificationMetadata_Assignments_AssignmentId] FOREIGN KEY ([AssignmentId]) REFERENCES [Assignments] ([Id]);
GO

ALTER TABLE [NotificationMetadata] ADD CONSTRAINT [FK_NotificationMetadata_Courses_CourseId] FOREIGN KEY ([CourseId]) REFERENCES [Courses] ([Id]);
GO

ALTER TABLE [NotificationMetadata] ADD CONSTRAINT [FK_NotificationMetadata_Materials_MaterialId] FOREIGN KEY ([MaterialId]) REFERENCES [Materials] ([Id]);
GO

ALTER TABLE [NotificationMetadata] ADD CONSTRAINT [FK_NotificationMetadata_SchoolGroups_GroupId] FOREIGN KEY ([GroupId]) REFERENCES [SchoolGroups] ([Id]);
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250228075718_AddMaterialMetadata', N'8.0.1');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Courses] ADD [ContentBlocksJson] nvarchar(max) NOT NULL DEFAULT N'';
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250228170850_AddContentBlocksJsonToCourse', N'8.0.1');
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

ALTER TABLE [Assignments] ADD [ContentMarkdown] nvarchar(max) NOT NULL DEFAULT N'';
GO

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20250303180120_lisättyAssignmentVaihtoehtioja', N'8.0.1');
GO

COMMIT;
GO

