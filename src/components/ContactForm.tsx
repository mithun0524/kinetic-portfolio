import { useEffect, useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import styles from './ContactForm.module.css'

// Optional: paste a Web3Forms access key (https://web3forms.com — free, no backend)
// to send silently. If empty, submitting falls back to opening a prefilled email.
const WEB3FORMS_ACCESS_KEY = 'eac8983f-fe6f-4cbc-acb6-37a821caa31c'
const EMAIL = 'mithun.chavan.a24@gmail.com'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function ContactForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [form, setForm] = useState({ name: '', email: '', link: '', message: '' })
  const [emailErr, setEmailErr] = useState('')

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

  useGSAP(
    () => {
      if (open) {
        gsap.set(root.current, { autoAlpha: 1 })
        if (prefersReducedMotion()) {
          gsap.set(panel.current, { yPercent: 0 })
          return
        }
        gsap
          .timeline()
          .fromTo(panel.current, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'power4.inOut' })
          .from(`.${styles.field}`, { y: 40, opacity: 0, stagger: 0.08, duration: 0.6, ease: 'power3.out' }, '-=0.25')
          .from(`.${styles.head}`, { y: 30, opacity: 0, duration: 0.6, ease: 'power3.out' }, '<')
      } else {
        if (prefersReducedMotion()) {
          gsap.set(root.current, { autoAlpha: 0 })
          return
        }
        gsap.to(panel.current, {
          yPercent: 100,
          duration: 0.5,
          ease: 'power4.in',
          onComplete: () => gsap.set(root.current, { autoAlpha: 0 }),
        })
      }
    },
    { dependencies: [open], scope: root }
  )

  // esc to close + lock scroll
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.message) return
    if (!validEmail(form.email)) {
      setEmailErr('Please enter a valid email address.')
      return
    }
    setEmailErr('')
    setStatus('sending')

    if (WEB3FORMS_ACCESS_KEY) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            access_key: WEB3FORMS_ACCESS_KEY,
            subject: `Portfolio message from ${form.name}`,
            from_name: form.name,
            email: form.email,
            link: form.link || '—',
            message: form.message,
          }),
        })
        setStatus(res.ok ? 'sent' : 'error')
      } catch {
        setStatus('error')
      }
    } else {
      // no key: open a prefilled email as a graceful fallback
      const linkLine = form.link ? `\nLink: ${form.link}` : ''
      const body = encodeURIComponent(`${form.message}${linkLine}\n\n— ${form.name} (${form.email})`)
      const subject = encodeURIComponent(`Portfolio message from ${form.name}`)
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`
      setStatus('sent')
    }
  }

  const field = (
    key: 'name' | 'email' | 'link' | 'message',
    label: string,
    type = 'text',
    optional = false
  ) => (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      {key === 'message' ? (
        <textarea
          className={styles.input}
          rows={3}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          required
        />
      ) : (
        <input
          className={styles.input}
          type={type}
          value={form[key]}
          onChange={(e) => {
            setForm({ ...form, [key]: e.target.value })
            if (key === 'email' && emailErr) setEmailErr('')
          }}
          aria-invalid={key === 'email' && !!emailErr}
          required={!optional}
        />
      )}
      <span className={styles.underline} />
      {key === 'email' && emailErr && <span className={styles.fieldErr}>{emailErr}</span>}
    </label>
  )

  return (
    <div ref={root} className={styles.overlay} role="dialog" aria-modal="true" data-nofloor>
      <div className={styles.backdrop} onClick={onClose} />
      <div ref={panel} className={styles.panel}>
        <button className={styles.close} onClick={onClose} aria-label="Close" data-cursor="grow">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>

        {status === 'sent' ? (
          <div className={styles.sent}>
            <div className={styles.check}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M8 21l8 8 16-18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className={`display ${styles.sentTitle}`}>Message on its way.</h3>
            <p className={styles.sentText}>Thanks {form.name || 'there'} — I&apos;ll get back to you soon.</p>
            <button className={styles.reset} onClick={onClose} data-cursor="grow">
              Close
            </button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={submit}>
            <div className={styles.head}>
              <span className="eyebrow">( Say hi )</span>
              <h3 className={`display ${styles.title}`}>Let&apos;s build something.</h3>
            </div>

            {field('name', 'Your name')}
            {field('email', 'Email', 'email')}
            {field('link', 'Link (optional)', 'url', true)}
            {field('message', 'What should move?')}

            <button className={styles.submit} type="submit" data-cursor="grow" disabled={status === 'sending'}>
              <span>{status === 'sending' ? 'Sending…' : 'Send message'}</span>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 16L16 4M16 4H6M16 4v10" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {status === 'error' && (
              <p className={styles.err}>Something went wrong — email me directly at {EMAIL}.</p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
