using DefikarteBackend.Model;
using DefikarteBackend.OsmOverpassApi;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class OverpassClientTests
    {
        [Test]
        public void ParseResponse_ValidResponse_ReturnsNodes()
        {
            var content = "{\"elements\":[{\"type\":\"node\",\"id\":1,\"lat\":47.1,\"lon\":8.1,\"tags\":{\"emergency\":\"defibrillator\"}}]}";

            var result = OverpassClient.ParseResponse(content);

            Assert.That(result, Has.Count.EqualTo(1));
            Assert.That(result[0].Id, Is.EqualTo("1"));
        }

        [TestCase("{\"remark\":\"runtime error: Query timed out in \\\"query\\\" at line 1 after 25 seconds.\",\"elements\":[]}")]
        [TestCase("{\"remark\":\"runtime error: out of memory\",\"elements\":[{\"type\":\"node\",\"id\":1,\"lat\":47.1,\"lon\":8.1}]}")]
        [TestCase("{\"elements\":[]}")]
        [TestCase("{\"version\":0.6}")]
        public void ParseResponse_InvalidResponse_Throws(string content)
        {
            Assert.Throws<InvalidOperationException>(() => OverpassClient.ParseResponse(content));
        }

        [Test]
        public void FeatureCollection_Timestamp_SurvivesRoundTrip()
        {
            var timestamp = new DateTime(2026, 10, 22, 8, 15, 0, DateTimeKind.Utc);
            var serializerSettings = new JsonSerializerSettings
            {
                ContractResolver = new DefaultContractResolver { NamingStrategy = new CamelCaseNamingStrategy() }
            };

            var json = JsonConvert.SerializeObject(new FeatureCollection { Timestamp = timestamp }, serializerSettings);
            var result = JsonConvert.DeserializeObject<FeatureCollection>(json);

            Assert.That(json, Does.Contain("\"timestamp\":\"2026-10-22T08:15:00Z\""));
            Assert.That(result?.Timestamp, Is.EqualTo(timestamp));
        }
    }
}
