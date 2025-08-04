namespace BlazorAltcha.Models;

public class AltchaPayload
{
    public string Salt { get; set; } = string.Empty;
    public int Number { get; set; }
    public string Challenge { get; set; } = string.Empty;
    public bool Test { get; set; }
}
