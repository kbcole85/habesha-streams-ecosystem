import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-xs text-gold tracking-widest font-bold uppercase mb-3 block">Legal</span>
          <h1 className="cinzel text-4xl font-bold text-foreground mb-3">Terms of Service</h1>
          <p className="text-muted-foreground text-sm">Effective Date: January 1, 2026 · Last Updated: February 2026</p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Habesha Streams ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the Service. These terms apply to all visitors, users, and others who access the Service.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">2. Eligibility</h2>
            <p>You must be at least 13 years of age (or the applicable legal minimum in your jurisdiction) to create an account. By creating an account, you represent that you meet this requirement and that all information you provide is accurate and complete. Accounts created on behalf of minors require parental or guardian consent.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">3. One-Device Policy</h2>
            <p className="mb-3">Habesha Streams enforces a strict one-active-device-per-account policy to protect content rights holders and maintain fair platform access:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account is tied to a single registered device upon first login.</li>
              <li>Logging in from an unregistered device will trigger a device verification check.</li>
              <li>Unauthorized access from a different device will result in account access being suspended on the new device.</li>
              <li>To change your registered device, contact support at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">4. No Credential Sharing</h2>
            <p>Sharing your account credentials with any third party is strictly prohibited. Each subscription is for the personal use of one individual on one device. Habesha Streams reserves the right to suspend or terminate accounts found to be sharing credentials or circumventing device enforcement mechanisms.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">5. Payment Obligations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscription fees are billed in advance on a monthly or annual cycle depending on the plan selected.</li>
              <li>Pay-per-view (PPV) purchases are billed immediately at the time of transaction.</li>
              <li>All prices are displayed in USD unless otherwise specified. Applicable taxes may apply.</li>
              <li>You authorize us to charge your selected payment method for all amounts due.</li>
              <li>Failed payments may result in service interruption until resolved.</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">6. Refund Policy</h2>
            <p>Please refer to our <a href="/refund-policy" className="text-gold hover:underline">Refund Policy</a> for full details. In summary: subscription fees are non-refundable once a billing cycle has commenced, and PPV purchases are non-refundable once playback has begun. Technical error refunds are reviewed case-by-case.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">7. Intellectual Property</h2>
            <p>All content available on Habesha Streams, including films, series, music, and promotional materials, is owned by or licensed to Habesha Streams. You may not download, record, reproduce, distribute, broadcast, or create derivative works of any content without explicit written permission. DRM and watermarking technologies are deployed to detect and prevent unauthorized copying.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">8. Prohibited Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to bypass, disable, or circumvent DRM, device locking, or other security measures.</li>
              <li>Share, sell, or transfer your account credentials to any third party.</li>
              <li>Use automated tools, bots, or scrapers to access or collect data from the Service.</li>
              <li>Upload, transmit, or distribute malicious code or content.</li>
              <li>Harass, impersonate, or harm other users or Habesha Streams staff.</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">9. Account Suspension &amp; Termination</h2>
            <p>Habesha Streams reserves the right to suspend or terminate your account at any time, with or without notice, for violation of these Terms of Service, fraudulent activity, or actions that harm other users, content creators, or the platform. Upon termination, your access to the Service will immediately cease.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">10. Limitation of Liability</h2>
            <p>To the fullest extent permitted by applicable law, Habesha Streams and its affiliates, officers, employees, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, even if advised of the possibility of such damages.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">11. Governing Law</h2>
            <p>These Terms of Service shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Delaware.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">12. Contact</h2>
            <p>For questions about these Terms, contact us at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
