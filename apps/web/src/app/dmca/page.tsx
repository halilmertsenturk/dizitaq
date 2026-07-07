import Link from 'next/link'

export default function DMCAPage() {
  return (
    <div className="mx-auto max-w-3xl p-6 md:p-12">
      <h1 className="mb-6 text-3xl font-bold text-zinc-100">DMCA Policy</h1>

      <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
        <p>
          Dizitaq does not host any video content on its servers. All video content displayed on
          this site is embedded from third-party services. As such, Dizitaq acts as a search engine
          and directory of content that is publicly available on the internet.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200 mt-8">Copyright Infringement Notification</h2>
        <p>
          If you believe that any content available through our service infringes upon your copyright,
          please submit a notification in writing with the following information:
        </p>

        <ul className="list-disc pl-6 space-y-2">
          <li>A physical or electronic signature of the copyright owner or authorized representative</li>
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>Identification of the material that is claimed to be infringing, with enough detail for us to locate it</li>
          <li>Your contact information: name, address, telephone number, and email</li>
          <li>A statement that you have a good faith belief that the use is not authorized</li>
          <li>A statement that the information in the notification is accurate and, under penalty of perjury, that you are authorized to act on behalf of the owner</li>
        </ul>

        <h2 className="text-lg font-semibold text-zinc-200 mt-8">Contact for DMCA Notices</h2>
        <p>
          Email: dmca@dizitaq.app<br />
          Please allow 1-3 business days for a response.
        </p>

        <h2 className="text-lg font-semibold text-zinc-200 mt-8">Counter-Notification</h2>
        <p>
          If your content was removed due to a DMCA notice and you believe it was a mistake,
          you may submit a counter-notification with the following:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Your physical or electronic signature</li>
          <li>Identification of the material that was removed</li>
          <li>A statement under penalty of perjury that you have a good faith belief the material was removed by mistake</li>
          <li>Your name, address, and telephone number, and a statement consenting to jurisdiction</li>
        </ul>
      </div>
    </div>
  )
}
