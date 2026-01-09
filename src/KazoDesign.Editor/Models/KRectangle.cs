namespace KazoDesign.Editor.Models;

/// <summary>
/// Represents a rectangle shape on the canvas.
/// </summary>
public class KRectangle : DesignElement
{
    /// <summary>
    /// Width of the rectangle.
    /// </summary>
    public double Width { get; set; } = 100;

    /// <summary>
    /// Height of the rectangle.
    /// </summary>
    public double Height { get; set; } = 60;

    /// <summary>
    /// Fill color of the rectangle.
    /// </summary>
    public string Fill { get; set; } = "#4a90d9";

    /// <summary>
    /// Stroke color of the rectangle.
    /// </summary>
    public string Stroke { get; set; } = "#2d5a87";

    /// <summary>
    /// Stroke width of the rectangle.
    /// </summary>
    public double StrokeWidth { get; set; } = 2;

    /// <summary>
    /// Corner radius for rounded rectangles.
    /// </summary>
    public double CornerRadius { get; set; } = 0;

    public override string ElementType => "rectangle";

    public override bool ContainsPoint(double px, double py)
    {
        return px >= X && px <= X + Width && py >= Y && py <= Y + Height;
    }

    protected override double GetCenterX() => X + Width / 2;
    protected override double GetCenterY() => Y + Height / 2;
}
