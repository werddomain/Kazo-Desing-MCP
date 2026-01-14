namespace KazoDesign.Editor.Models;

/// <summary>
/// Represents the entire design document with all elements.
/// </summary>
public class DesignDocument
{
    /// <summary>
    /// Document title.
    /// </summary>
    public string Title { get; set; } = "Untitled Design";

    /// <summary>
    /// User-editable description of the design purpose or contents.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Canvas width in pixels.
    /// </summary>
    public double CanvasWidth { get; set; } = 800;

    /// <summary>
    /// Canvas height in pixels.
    /// </summary>
    public double CanvasHeight { get; set; } = 600;

    /// <summary>
    /// Background color of the canvas.
    /// </summary>
    public string BackgroundColor { get; set; } = "#1e1e1e";

    /// <summary>
    /// All design elements on the canvas.
    /// </summary>
    public List<DesignElement> Elements { get; set; } = [];

    /// <summary>
    /// Original user prompt from AI assistant that initiated this design task.
    /// This is set by the AI agent when requesting a sketch.
    /// </summary>
    public string? Prompt { get; set; }

    /// <summary>
    /// AI assistant context - additional information about the task.
    /// Can be used to store AI-specific metadata for resuming work.
    /// </summary>
    public string? AiContext { get; set; }

    /// <summary>
    /// Creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last modified timestamp.
    /// </summary>
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
}
