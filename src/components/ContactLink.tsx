interface ContactLinkProps {
  visible: boolean
}

export default function ContactLink({ visible }: ContactLinkProps) {
  if (!visible) return null

  return (
    <footer className="mx-auto w-full max-w-md shrink-0 px-4 py-3 text-center">
      <p className="text-[10px] leading-snug text-slate-400">
        Questions or feedback?{' '}
        <a
          href="mailto:rohdamin3@gmail.com"
          className="text-slate-500 transition hover:text-slate-600 hover:underline"
        >
          Contact us
        </a>
      </p>
    </footer>
  )
}
