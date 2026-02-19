import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-xs text-gold tracking-widest font-bold uppercase mb-3 block">Legal</span>
          <h1 className="cinzel text-4xl font-bold text-foreground mb-3">Refund Policy</h1>
          <p className="text-muted-foreground text-sm">Effective Date: January 1, 2026 · Last Updated: February 2026</p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">1. Subscription Fees</h2>
            <p className="mb-3">All subscription fees (monthly or annual) are billed in advance and are <strong className="text-foreground">non-refundable once the billing cycle has commenced</strong>. This includes:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Monthly subscription renewals charged at the start of each billing period.</li>
              <li>Annual subscriptions charged upfront for the full year.</li>
              <li>Upgrades or plan changes pro-rated within the current billing period.</li>
            </ul>
            <p className="mt-3">You may cancel your subscription at any time through your account settings. Upon cancellation, you will retain access until the end of your current paid billing period, after which your account will revert to free access or close.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">2. Pay-Per-View (PPV) Purchases</h2>
            <p className="mb-3">PPV content purchases are <strong className="text-foreground">non-refundable once playback has been initiated</strong>. This applies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Individual film or event rentals with time-limited access windows.</li>
              <li>Permanent purchase licenses for individual titles.</li>
              <li>Live event access passes.</li>
            </ul>
            <p className="mt-3">If you purchase a PPV title but have <em>not</em> begun playback, you may request a refund within 24 hours of purchase by contacting our support team.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">3. Technical Error Refunds</h2>
            <p className="mb-3">If you experience a verifiable technical failure that prevented access to purchased content (e.g., platform outage, encoding error, payment double-charge), you may be eligible for a refund or credit. To request a technical error refund:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Contact <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a> within 7 days of the issue.</li>
              <li>Include your account email, the affected title or subscription period, and a description of the issue.</li>
              <li>Our team will review and respond within 5 business days.</li>
            </ul>
            <p className="mt-3">Technical error refunds are reviewed on a case-by-case basis. Habesha Streams reserves the right to offer account credit in lieu of a monetary refund.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">4. Free Trial</h2>
            <p>If you signed up using a free trial offer, you will not be charged until the trial period ends. You may cancel before the trial ends to avoid any charges. Free trials are available once per account; subsequent accounts created to obtain additional free trials may be subject to immediate billing or account suspension.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">5. Refund Logging</h2>
            <p>All approved refund actions are logged in our administrative system with timestamps, agent IDs, and refund reasons. This ensures full accountability and audit compliance.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">6. Contact</h2>
            <p>For refund requests or billing questions, contact our team at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
