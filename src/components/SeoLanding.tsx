interface SeoLandingProps {
  onSignUpClick: () => void
}

export default function SeoLanding({ onSignUpClick }: SeoLandingProps) {
  return (
    <section
      className="mt-8 w-full max-w-[210mm] rounded-lg border border-slate-200 bg-white px-6 py-8 text-slate-700 shadow-sm print:hidden"
      aria-labelledby="seo-landing-title"
    >
      <h1
        id="seo-landing-title"
        className="font-['Cormorant_Garamond',serif] text-2xl font-semibold text-slate-800"
      >
        Cornell Note Taking — Free Online Cornell Notes App
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
        Cornell Note Taking is a free Cornell note taking site for students and
        lifelong learners. Use the classic Cornell layout — cue column, notes
        area, and summary section — directly in your browser. Sign up to save
        notes by chapter, or start typing right away and export A4-ready PDFs
        for printing.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">
        How the Cornell note taking system works
      </h2>
      <ul className="mt-2 list-inside list-disc space-y-1 text-[15px] leading-relaxed text-slate-600">
        <li>
          <strong className="font-medium text-slate-700">Cue column</strong> —
          keywords and questions to review later
        </li>
        <li>
          <strong className="font-medium text-slate-700">Notes area</strong> —
          lecture or reading notes during class
        </li>
        <li>
          <strong className="font-medium text-slate-700">Summary</strong> —
          a short recap at the bottom of each page
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold text-slate-800">
        Frequently asked questions
      </h2>
      <dl className="mt-3 space-y-4 text-[15px] leading-relaxed text-slate-600">
        <div>
          <dt className="font-medium text-slate-700">
            Is this Cornell note taking site free?
          </dt>
          <dd className="mt-1">
            Yes. You can use the Cornell notes editor for free. Create an
            account to save and organize notes across chapters.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">
            Can I use Cornell notes online without installing anything?
          </dt>
          <dd className="mt-1">
            Yes. This is a web-based Cornell note taking app — open the site in
            any browser on desktop or mobile.
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">
            Can I print or export my Cornell notes?
          </dt>
          <dd className="mt-1">
            Yes. Use Export to generate a clean A4 PDF layout that matches the
            Cornell note format.
          </dd>
        </div>
      </dl>

      <p className="mt-6 text-[15px] text-slate-600">
        Ready to start?{' '}
        <button
          type="button"
          onClick={onSignUpClick}
          className="font-medium text-slate-800 underline-offset-2 hover:underline"
        >
          Sign up for free
        </button>{' '}
        and keep your Cornell notes synced across devices.
      </p>
    </section>
  )
}
