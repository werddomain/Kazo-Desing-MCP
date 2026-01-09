namespace KazoDesign.Editor.Models;

/// <summary>
/// Represents an image element on the canvas.
/// </summary>
public class KImage : DesignElement
{
    /// <summary>
    /// Image source - can be a URL or Base64 data URI.
    /// </summary>
    public string Source { get; set; } = string.Empty;

    /// <summary>
    /// Display width of the image.
    /// </summary>
    public double Width { get; set; } = 100;

    /// <summary>
    /// Display height of the image.
    /// </summary>
    public double Height { get; set; } = 100;

    /// <summary>
    /// Original width of the image (for reference).
    /// </summary>
    public double OriginalWidth { get; set; }

    /// <summary>
    /// Original height of the image (for reference).
    /// </summary>
    public double OriginalHeight { get; set; }

    /// <summary>
    /// Whether to preserve the aspect ratio when resizing.
    /// </summary>
    public bool PreserveAspectRatio { get; set; } = true;

    public override string ElementType => "image";

    public override bool ContainsPoint(double px, double py)
    {
        return px >= X && px <= X + Width && py >= Y && py <= Y + Height;
    }

    protected override double GetCenterX() => X + Width / 2;
    protected override double GetCenterY() => Y + Height / 2;
}
