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
    /// User prompt used to generate this design (if AI-generated).
    /// </summary>
    public string? Prompt { get; set; }

    /// <summary>
    /// Creation timestamp.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Last modified timestamp.
    /// </summary>
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
}
