export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-12">
      <h1 className="mb-6 text-3xl font-bold text-zinc-100">Terms of Service</h1>

      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-lg font-semibold text-zinc-200">1. Acceptance of Terms</h2>
        <p>
          By accessing and using Dizitaq, you agree to be bound by these Terms of Service.
          If you do not agree, please do not use the service.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200">2. Description of Service</h2>
        <p>
          Dizitaq is a content discovery and aggregation platform that indexes publicly available
          video content from third-party sources. We do not host, store, or transmit any
          copyrighted content on our servers. All videos are embedded from third-party providers
          over whom we have no control.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200">3. User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You must not use the service for any illegal purpose</li>
          <li>You must not attempt to circumvent any security measures</li>
          <li>You must not submit false reports or abuse the reporting system</li>
          <li>You must not engage in any activity that disrupts the service</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-200">4. Third-Party Content</h2>
        <p>
          We are not responsible for the content, accuracy, or legality of third-party content
          displayed through our service. Users access third-party content at their own risk.
          All trademarks and copyrights are property of their respective owners.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200">5. Limitation of Liability</h2>
        <p>
          Dizitaq is provided &quot;as is&quot; without any warranty. We shall not be liable for any
          damages arising from the use or inability to use the service.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200">6. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the new terms.
        </p>

        <p className="mt-8 text-xs text-zinc-600">Last updated: July 2026</p>
      </div>
    </div>
  )
}
