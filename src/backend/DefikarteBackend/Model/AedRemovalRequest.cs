namespace DefikarteBackend.Model
{
    public class AedRemovalRequest
    {
        /// <summary>
        /// Why the AED is permanently gone: dismantled, stolen, destroyed or incorrect (mapped by mistake).
        /// </summary>
        public string? Reason { get; set; }

        public string? Comment { get; set; }

        public string? Reporter { get; set; }
    }
}
