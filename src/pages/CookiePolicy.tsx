import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-xs text-gold tracking-widest font-bold uppercase mb-3 block">Legal</span>
          <h1 className="cinzel text-4xl font-bold text-foreground mb-3">Cookie Policy</h1>
          <p className="text-muted-foreground text-sm">Effective Date: January 1, 2026 · Last Updated: February 2026</p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">1. What Are Cookies?</h2>
            <p>Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work efficiently and provide reporting information. Habesha Streams uses cookies and similar tracking technologies (e.g., local storage, session tokens) to enhance your experience on our platform.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">2. Essential Cookies</h2>
            <p className="mb-3">These cookies are strictly necessary for the platform to function. They cannot be disabled without breaking core functionality.</p>
            <div className="border border-gold/10 rounded-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-raised">
                  <tr>
                    <th className="text-left p-3 text-foreground font-semibold">Cookie</th>
                    <th className="text-left p-3 text-foreground font-semibold">Purpose</th>
                    <th className="text-left p-3 text-foreground font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">sb-auth-token</td>
                    <td className="p-3">Authentication session token</td>
                    <td className="p-3">Session / 7 days</td>
                  </tr>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">device-fp</td>
                    <td className="p-3">Device fingerprint for security enforcement</td>
                    <td className="p-3">1 year</td>
                  </tr>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">csrf-token</td>
                    <td className="p-3">Cross-site request forgery protection</td>
                    <td className="p-3">Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">3. Analytics Cookies</h2>
            <p className="mb-3">These cookies help us understand how users interact with the platform so we can improve our service. Data is collected in aggregate and is not linked to personally identifiable information unless you are logged in.</p>
            <div className="border border-gold/10 rounded-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-raised">
                  <tr>
                    <th className="text-left p-3 text-foreground font-semibold">Cookie</th>
                    <th className="text-left p-3 text-foreground font-semibold">Purpose</th>
                    <th className="text-left p-3 text-foreground font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">hs-analytics</td>
                    <td className="p-3">Platform usage analytics (page views, watch events)</td>
                    <td className="p-3">90 days</td>
                  </tr>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">hs-session-id</td>
                    <td className="p-3">Session stitching for funnel analysis</td>
                    <td className="p-3">30 minutes</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">4. Security Cookies</h2>
            <p className="mb-3">These cookies support our fraud detection, rate limiting, and brute-force protection systems.</p>
            <div className="border border-gold/10 rounded-sm overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-surface-raised">
                  <tr>
                    <th className="text-left p-3 text-foreground font-semibold">Cookie</th>
                    <th className="text-left p-3 text-foreground font-semibold">Purpose</th>
                    <th className="text-left p-3 text-foreground font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">hs-rate-limit</td>
                    <td className="p-3">Login attempt rate limiting</td>
                    <td className="p-3">15 minutes</td>
                  </tr>
                  <tr className="border-t border-gold/10">
                    <td className="p-3 text-gold font-mono">hs-security</td>
                    <td className="p-3">Anomalous activity detection</td>
                    <td className="p-3">7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">5. Managing Cookie Preferences</h2>
            <p className="mb-3">You can control and manage cookies in several ways:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Browser settings</strong> — Most browsers allow you to view, block, or delete cookies through their settings menus.</li>
              <li><strong className="text-foreground">Essential cookies</strong> — Cannot be disabled; disabling them via browser settings will prevent login and core functionality from working.</li>
              <li><strong className="text-foreground">Analytics &amp; security cookies</strong> — Can be limited via browser settings or by contacting us, though doing so may affect platform performance monitoring.</li>
            </ul>
            <p className="mt-3">For questions about cookie usage, contact us at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">6. Policy Updates</h2>
            <p>We may update this Cookie Policy as our technology and legal obligations evolve. Significant changes will be communicated via in-app notice or email. Continued use of the platform after such notice constitutes acceptance.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CookiePolicy;
