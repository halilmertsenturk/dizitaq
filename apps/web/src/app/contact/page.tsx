export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-12">
      <h1 className="mb-6 text-3xl font-bold text-zinc-100">Contact</h1>

      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <p>
          For general inquiries, feedback, or support, please reach out to us:
        </p>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">General Inquiries</h2>
            <p className="text-zinc-500">contact@dizitaq.app</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">DMCA / Copyright</h2>
            <p className="text-zinc-500">dmca@dizitaq.app</p>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-200">Report an Issue</h2>
            <p className="text-zinc-500">
              Use the &quot;Report&quot; button on the video player to report broken or inappropriate sources.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          We aim to respond to all inquiries within 1-3 business days.
        </p>
      </div>
    </div>
  )
}
