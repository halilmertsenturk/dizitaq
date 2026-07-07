export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-12">
      <h1 className="mb-6 text-3xl font-bold text-zinc-100">Privacy Policy</h1>

      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-lg font-semibold text-zinc-200">1. Information We Collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account information:</strong> Name, email address, and hashed password when you register</li>
          <li><strong>Watch history:</strong> Titles and episodes you watch, for the &quot;Continue Watching&quot; feature</li>
          <li><strong>Preferences:</strong> Watchlist, favorites, ratings, and comments you submit</li>
          <li><strong>Usage data:</strong> Pages visited, search queries, and interactions with the service</li>
          <li><strong>Technical data:</strong> IP address, browser type, and device information (temporarily for rate limiting)</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-200">2. How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provide and maintain the service</li>
          <li>Personalize your experience (continue watching, recommendations)</li>
          <li>Improve our service through analytics</li>
          <li>Protect against abuse and enforce rate limits</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-200">3. Data Storage</h2>
        <p>
          Your data is stored securely on our database provider (Neon.tech) and cached
          in Redis (Upstash). We use industry-standard encryption for data in transit.
          Passwords are hashed using bcrypt with 12 salt rounds.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200">4. Data Sharing</h2>
        <p>
          We do not sell your personal data. We may share anonymized, aggregated data
          for analytics purposes. We may disclose information if required by law.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200">5. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access your personal data</li>
          <li>Delete your account and associated data</li>
          <li>Opt out of data collection by ceasing use of the service</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-200">6. Third-Party Services</h2>
        <p>
          We use Vercel (hosting), Neon.tech (database), Upstash (caching), and
          Watchmode API (content metadata). These services have their own privacy policies.
        </p>

        <p className="mt-8 text-xs text-zinc-600">Last updated: July 2026</p>
      </div>
    </div>
  )
}
