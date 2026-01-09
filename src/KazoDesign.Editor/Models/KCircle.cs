namespace KazoDesign.Editor.Models;

/// <summary>
/// Represents a circle shape on the canvas.
/// </summary>
public class KCircle : DesignElement
{
    /// <summary>
    /// Radius of the circle.
    /// </summary>
    public double Radius { get; set; } = 50;

    /// <summary>
    /// Fill color of the circle.
    /// </summary>
    public string Fill { get; set; } = "#5cb85c";

    /// <summary>
    /// Stroke color of the circle.
    /// </summary>
    public string Stroke { get; set; } = "#3d8b3d";

    /// <summary>
    /// Stroke width of the circle.
    /// </summary>
    public double StrokeWidth { get; set; } = 2;

    public override string ElementType => "circle";

    public override bool ContainsPoint(double px, double py)
    {
        var dx = px - X;
        var dy = py - Y;
        return (dx * dx + dy * dy) <= (Radius * Radius);
    }

    protected override double GetCenterX() => X;
    protected override double GetCenterY() => Y;
}
