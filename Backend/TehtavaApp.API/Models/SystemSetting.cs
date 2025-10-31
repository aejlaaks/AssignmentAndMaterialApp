namespace TehtavaApp.API.Models
{
    public class SystemSetting
        {
        public int Id { get; set; } // Added primary key
        public required string SettingName { get; set; }
        public required string SettingValue { get; set; }
        }
}
