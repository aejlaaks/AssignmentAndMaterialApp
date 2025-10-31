using AutoMapper;
using TehtavaApp.API.DTOs;
using TehtavaApp.API.Models;
using System;

namespace TehtavaApp.API.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Submission mappings
            CreateMap<AssignmentSubmission, SubmissionResponseDto>()
                .ForMember(dest => dest.SubmissionText, opt => opt.MapFrom(src => src.SubmissionText))
                .ForMember(dest => dest.FeedbackText, opt => opt.MapFrom(src => src.FeedbackText))
                .ForMember(dest => dest.StudentName, opt => opt.MapFrom(src => 
                    src.Student != null ? $"{src.Student.FirstName} {src.Student.LastName}" : src.StudentName ?? src.StudentId))
                .ForMember(dest => dest.GradedByName, opt => opt.MapFrom(src => 
                    src.GradedBy != null ? $"{src.GradedBy.FirstName} {src.GradedBy.LastName}" : ""))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => 
                    MapStringToSubmissionStatus(src.Status)));
            
            // Material mappings
            CreateMap<Material, MaterialDTO>();
            
            // Notification mappings
            CreateMap<Notification, NotificationDTO>();
            CreateMap<NotificationMetadata, NotificationMetadataDTO>();
            CreateMap<NotificationAction, NotificationActionDTO>();
            CreateMap<NotificationPreference, NotificationPreferenceDTO>();
        }

        private SubmissionStatus MapStringToSubmissionStatus(string status)
        {
            return status.ToLower() switch
            {
                "draft" => SubmissionStatus.Draft,
                "submitted" => SubmissionStatus.Submitted,
                "graded" => SubmissionStatus.Graded,
                "returned" => SubmissionStatus.Returned,
                "revised" => SubmissionStatus.Revised,
                "late" => SubmissionStatus.Late,
                "overdue" => SubmissionStatus.Overdue,
                _ => SubmissionStatus.Submitted // Default to Submitted if unknown
            };
        }
    }
} 