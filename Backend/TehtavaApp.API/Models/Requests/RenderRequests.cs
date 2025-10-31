using System.ComponentModel.DataAnnotations;

namespace TehtavaApp.API.Models.Requests
{
    /// <summary>
    /// Request model for rendering LaTeX content
    /// </summary>
    public class RenderLatexRequest
    {
        /// <summary>
        /// The LaTeX content to render
        /// </summary>
        [Required]
        public string Content { get; set; }

        /// <summary>
        /// Whether the LaTeX content should be rendered as inline (true) or display (false) mode
        /// </summary>
        public bool IsInline { get; set; } = false;
        
        /// <summary>
        /// Optional debug identifier for tracking rendering requests
        /// </summary>
        public string DebugId { get; set; }
    }

    /// <summary>
    /// Request model for rendering diagram content (Mermaid, GraphViz)
    /// </summary>
    public class RenderDiagramRequest
    {
        /// <summary>
        /// The diagram content to render
        /// </summary>
        [Required]
        public string Content { get; set; }
        
        /// <summary>
        /// Optional debug identifier for tracking rendering requests
        /// </summary>
        public string DebugId { get; set; }
        
        /// <summary>
        /// Optional rendering options
        /// </summary>
        public DiagramRenderOptions Options { get; set; }
    }
    
    /// <summary>
    /// Options for diagram rendering
    /// </summary>
    public class DiagramRenderOptions
    {
        /// <summary>
        /// Output image format (png, svg, etc.)
        /// </summary>
        public string Format { get; set; } = "png";
        
        /// <summary>
        /// Resolution in dots per inch (higher values create sharper images)
        /// </summary>
        public int Dpi { get; set; } = 200;
        
        /// <summary>
        /// Whether to apply anti-aliasing
        /// </summary>
        public bool Antialias { get; set; } = true;
        
        /// <summary>
        /// Quality level for rendering (low, medium, high)
        /// </summary>
        public string Quality { get; set; } = "medium";
    }

    /// <summary>
    /// Request model for rendering Markdown content with diagrams and LaTeX
    /// </summary>
    public class RenderMarkdownRequest
    {
        /// <summary>
        /// The Markdown content to render
        /// </summary>
        [Required]
        public string Content { get; set; }
        
        /// <summary>
        /// Optional debug identifier for tracking rendering requests
        /// </summary>
        public string DebugId { get; set; }
    }
} 