using DefikarteBackend.Helpers;
using System.Net;

namespace DefikarteBackend.Tests
{
    [TestFixture]
    public class ClientIpResolverTests
    {
        [Test]
        public void Resolve_ShouldUseTheLastEntryOfForwardedFor()
        {
            // everything before the last entry was sent by the caller and can be faked
            var ip = ClientIpResolver.Resolve("6.6.6.6, 203.0.113.7", "9.9.9.9", IPAddress.Parse("10.0.0.1"));

            Assert.That(ip, Is.EqualTo("203.0.113.7"));
        }

        [TestCase("203.0.113.7:51234", "203.0.113.7")]
        [TestCase("[2001:db8:1:2:3:4:5:6]:443", "2001:db8:1:2::")]
        [TestCase("::ffff:203.0.113.7", "203.0.113.7")]
        public void Resolve_ShouldRemoveThePortAndNormalize(string forwardedFor, string expected)
        {
            Assert.That(ClientIpResolver.Resolve(forwardedFor, null, null), Is.EqualTo(expected));
        }

        [Test]
        public void Resolve_ShouldTreatAllAddressesOfAnIpv6Network64AsOneCaller()
        {
            var first = ClientIpResolver.Resolve("2001:db8:1:2:aaaa:bbbb:cccc:dddd", null, null);
            var second = ClientIpResolver.Resolve("2001:db8:1:2:1111:2222:3333:4444", null, null);
            var otherNetwork = ClientIpResolver.Resolve("2001:db8:1:3:1111:2222:3333:4444", null, null);

            Assert.That(second, Is.EqualTo(first));
            Assert.That(otherNetwork, Is.Not.EqualTo(first));
        }

        [Test]
        public void Resolve_WithoutForwardedFor_ShouldFallBackToClientIpAndThenTheConnection()
        {
            Assert.That(ClientIpResolver.Resolve(null, "198.51.100.4", IPAddress.Parse("10.0.0.1")), Is.EqualTo("198.51.100.4"));
            Assert.That(ClientIpResolver.Resolve("", "", IPAddress.Parse("10.0.0.1")), Is.EqualTo("10.0.0.1"));
        }

        [Test]
        public void Resolve_GivenGarbage_ShouldSkipItAndReturnNullIfNothingIsUsable()
        {
            Assert.That(ClientIpResolver.Resolve("not an ip", "198.51.100.4", null), Is.EqualTo("198.51.100.4"));
            Assert.That(ClientIpResolver.Resolve("not an ip", null, null), Is.Null);
        }
    }
}
