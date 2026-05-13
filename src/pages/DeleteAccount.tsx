import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const DeleteAccount = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="mb-12">
          <span className="text-xs text-gold tracking-widest font-bold uppercase mb-3 block">Account</span>
          <h1 className="cinzel text-4xl font-bold text-foreground mb-3">Delete Your Account</h1>
          <p className="text-muted-foreground text-sm">How to delete your Habesha Streams account and the data associated with it.</p>
        </div>

        <div className="space-y-10 text-sm text-muted-foreground leading-relaxed">
          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">Option 1 — Delete from the app (recommended)</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Open the Habesha Streams app and sign in.</li>
              <li>Tap your profile to open the <strong className="text-foreground">Account</strong> page.</li>
              <li>Scroll to the <strong className="text-foreground">Delete Account</strong> tab in the sidebar.</li>
              <li>Confirm your decision. Your account will be deactivated immediately and queued for full deletion.</li>
            </ol>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">Option 2 — Email request</h2>
            <p>If you can no longer sign in to the app or prefer to make the request by email, contact us at <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a> with the subject line "Delete my account". Please send the email from the address registered to your account so we can verify your identity.</p>
            <p className="mt-3">We respond to deletion requests within <strong className="text-foreground">7 business days</strong>. The full deletion process completes within 30 days of receipt.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">What gets deleted</h2>
            <p className="mb-3">When your account is deleted, we permanently remove:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your profile (name, email, display name, avatar)</li>
              <li>Your authentication credentials</li>
              <li>Your watch history and watchlist</li>
              <li>Your device fingerprint and login attempt records</li>
              <li>Any videos you uploaded as a creator (and the corresponding storage files)</li>
              <li>Any live broadcasts you recorded</li>
              <li>Your push-notification tokens</li>
              <li>Your in-app messages and notifications</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">What we may keep (and why)</h2>
            <p className="mb-3">Some information is retained for legal, accounting and fraud-prevention purposes even after your account is deleted:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Payment and billing records</strong> — retained for a minimum of 7 years to satisfy tax and accounting law. Stored in a way that no longer identifies you personally where possible.</li>
              <li><strong className="text-foreground">Security incident logs</strong> — retained for up to 12 months when relevant to an investigation of suspected fraud, account sharing or platform abuse.</li>
              <li><strong className="text-foreground">Aggregated, anonymised analytics</strong> — overall usage statistics that no longer identify you may continue to be used to improve the service.</li>
              <li><strong className="text-foreground">Content you posted publicly</strong> — if your live broadcasts or uploaded videos were viewed by others, references to that content in their watch histories or analytics events remain (with your user_id removed).</li>
            </ul>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">Subscription</h2>
            <p>If you have an active paid subscription at the time of deletion, we will cancel future renewals. <strong className="text-foreground">No refund is automatically issued for the current billing period</strong> — your subscription remains active until the end of the period you've already paid for, then ends. If you believe you are entitled to a refund, please request one through <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a> before initiating the deletion.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">After deletion</h2>
            <p>Once your account is deleted you cannot recover it. You may sign up again with the same email address in the future, but it will be a completely new account with no link to your previous history, watchlist or creator content.</p>
          </section>

          <section>
            <h2 className="cinzel text-lg font-bold text-foreground mb-3">Questions</h2>
            <p>For any questions about account deletion or data retention, contact <a href="mailto:support@habeshastreams.com" className="text-gold hover:underline">support@habeshastreams.com</a>.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DeleteAccount;
