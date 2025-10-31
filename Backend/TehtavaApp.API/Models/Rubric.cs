using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    public class Rubric
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [Required]
        [BsonRepresentation(BsonType.ObjectId)]
        public string AssignmentId { get; set; }

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        public double TotalPoints { get; set; }

        [Required]
        public List<RubricCriterion> Criteria { get; set; } = new List<RubricCriterion>();
    }

    public class RubricCriterion
    {
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        [Range(0.1, 3.0)]
        public double Weight { get; set; } = 1.0;

        [Required]
        public List<RubricLevel> Levels { get; set; } = new List<RubricLevel>();
    }

    public class RubricLevel
    {
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

        [Required]
        public string Title { get; set; }

        public string Description { get; set; }

        [Range(0, 10.0)]
        public double Points { get; set; }
    }
} 