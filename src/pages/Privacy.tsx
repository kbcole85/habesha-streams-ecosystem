import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-xs text-gold tracking-widest font-bold uppercase mb-3 block">Legal</span>
          <h1 className="cinzel text-4xl font-bold text-foreground mb-3">Privacy Policy</h1>
          <p className="text-muted-foreground text-sm">Effective Date: January 1, 2026 · Last Updated: February 2026</p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-3">Habesha Streams ("we," "us," or "our") collects the following categories of information when you use our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Account information</strong> — name, email address, and encrypted password hash.</li>
              <li><strong className="text-foreground">Payment information</strong> — processed securely via a third-party payment gateway. We do <em>not</em> store raw credit card or banking details.</li>
              <li><strong className="text-foreground">Device fingerprint data</strong> — a hashed identifier used strictly for one-device security enforcement and fraud prevention.</li>
              <li><strong className="text-foreground">Watch history &amp; analytics events</strong> — titles viewed, duration watched, quality selected, and feature interactions.</li>
              <li><strong className="text-foreground">IP address &amp; login metadata</strong> — timestamps, geolocation (country level), device type, and browser user agent.</li>
              <li><strong className="text-foreground">Customer support communications</strong> — messages, tickets, and associated attachments you send us.</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, maintain, and improve our streaming services.</li>
              <li>Enforce our one-device security policy and prevent unauthorized account sharing.</li>
              <li>Process subscription payments and pay-per-view purchases.</li>
              <li>Personalize content recommendations based on watch history.</li>
              <li>Detect fraud, abuse, and security threats.</li>
              <li>Comply with applicable legal and regulatory obligations.</li>
              <li>Send transactional communications (receipts, password resets, policy updates).</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">3. Device Fingerprinting</h2>
            <p>To enforce account security and prevent credential sharing, we generate and store a hashed device fingerprint linked to your account upon first login. This fingerprint is derived from browser or device characteristics and is used solely for authentication and fraud prevention. It is not used for cross-site tracking or advertising purposes.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">4. Data Sharing</h2>
            <p className="mb-3">We may share limited data with trusted third parties only as necessary:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Payment processors</strong> — for secure transaction handling.</li>
              <li><strong className="text-foreground">Cloud hosting &amp; CDN providers</strong> — for platform infrastructure and content delivery.</li>
              <li><strong className="text-foreground">Analytics partners</strong> — aggregated, anonymized usage data only.</li>
              <li><strong className="text-foreground">Legal authorities</strong> — when required by applicable law, court order, or government request.</li>
            </ul>
            <p className="mt-3 font-medium text-foreground">We do not sell, rent, or trade your personal data to any third party for marketing purposes.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">5. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data is retained for as long as your account is active.</li>
              <li>Purchase and billing history is retained for a minimum of 7 years for accounting and legal compliance.</li>
              <li>Security logs and login attempt records are retained for up to 12 months for fraud monitoring.</li>
              <li>Upon account deletion, personal data is purged within 30 days, subject to legal retention obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">6. Security Measures</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data transmissions are encrypted via HTTPS/TLS.</li>
              <li>Authentication uses industry-standard JWT tokens with short expiry windows.</li>
              <li>Sensitive fields are encrypted at rest using AES-256 encryption.</li>
              <li>Streaming content is DRM-protected to prevent unauthorized copying.</li>
              <li>Rate limiting and brute-force protections are applied to all authentication endpoints.</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Request a copy of the personal data we hold about you.</li>
              <li>Request correction of inaccurate or incomplete data.</li>
              <li>Request deletion of your account and associated data (subject to legal retention limits).</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Cancel your subscription at any time through your account settings.</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">8. Cookies</h2>
            <p>We use cookies and similar technologies for authentication, session management, analytics, and security. Please see our <a href="/cookies" className="text-gold hover:underline">Cookie Policy</a> for full details. You may manage cookie preferences through your browser settings; however, disabling essential cookies may limit platform functionality.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">9. Children's Privacy</h2>
            <p>Habesha Streams is not directed to children under the age of 13 (or the applicable legal minimum age in your jurisdiction). We do not knowingly collect personal information from minors. If you believe a child has provided us with personal information, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">10. Policy Updates</h2>
            <p>We may update this Privacy Policy from time to time. Material changes will be communicated via email notification or a prominent in-app notice at least 14 days prior to the change taking effect. Continued use of the platform after such notice constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">11. Contact</h2>
            <p>For privacy-related inquiries, contact our team at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
