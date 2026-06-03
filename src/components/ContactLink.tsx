export default function ContactLink() {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-slate-100 px-4 py-3 text-center">
      <p className="text-[13px] leading-snug text-slate-500">
        Questions or feedback?{' '}
        <a
          href="mailto:rohdamin3@gmail.com"
          className="text-slate-600 transition hover:text-slate-800 hover:underline"
        >
          Contact us
        </a>
      </p>
    </footer>
  )
}
