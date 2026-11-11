import { useEffect, useRef, useState, type FormEvent } from 'react'
import { facade, arches, columns, wordmark } from './assets'
import { COPY, type Lang } from './copy'

const PHONE = '0916 607 555'
const PHONE_HREF = 'tel:0916607555'
const EMAIL = 'stellarhotel.signature@gmail.com'
const FACEBOOK = 'https://www.facebook.com/hotelstellarboutique/'
const ADDRESS_Q = encodeURIComponent('04-06 Nội Khu Hưng Gia 3, Tân Phong, Quận 7, Hồ Chí Minh')
const MAP_SRC = `https://www.google.com/maps?q=${ADDRESS_Q}&z=16&output=embed`
const MAP_DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${ADDRESS_Q}`

/* From the hotel's rate sheet, effective 01/11/2026, VAT included (VND per night). */
const ROOMS = [
  { name: 'Superior Room', size: 18, withBf: 710000, noBf: 650000 },
  { name: 'Deluxe Room', size: 30, withBf: 810000, noBf: 750000 },
  { name: 'Deluxe Executive', size: 30, withBf: 860000, noBf: 800000 },
  { name: 'Twin Room', size: 30, withBf: 950000, noBf: 890000 },
]
const money = (n: number, lang: Lang) => (lang === 'vi' ? `${n.toLocaleString('vi-VN')} ₫` : `${n.toLocaleString('en-US')} VND`)

/* The hotel's four-point star, traced from the supplied logo file. */
function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="100 80 1055 1015" aria-hidden="true" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M627 92 778 462 1138 590 780 718 627 1080 476 718 115 590 474 462ZM627 260 536 512 282 590 536 668 627 922 718 668 972 590 718 512ZM627 432 590 552 452 590 590 630 627 768 667 630 800 590 667 552Z"
      />
    </svg>
  )
}

const Icon = {
  pin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.2 4.2 2 2 0 0 1 4.2 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.2Z" /></svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="1" /><path d="m22 6-10 7L2 6" /></svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg>
  ),
}

/* Fires once per element when it scrolls into view. */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal')
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('in')
            io.unobserve(en.target)
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
}

const SECTIONS = ['about', 'rooms', 'gallery', 'location', 'reserve'] as const

function useActiveSection() {
  const [active, setActive] = useState<string>('')
  useEffect(() => {
    const els = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) setActive(en.target.id)
        }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])
  return active
}

const today = () => new Date().toISOString().slice(0, 10)

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('lang')
      if (saved === 'vi' || saved === 'en') return saved
    } catch { /* storage may be unavailable */ }
    return 'vi'
  })
  const t = COPY[lang]
  const [scrolled, setScrolled] = useState(false)
  const [menu, setMenu] = useState(false)
  const active = useActiveSection()

  // Shared booking state: the availability bar feeds the full form (commitment: start small).
  const [checkin, setCheckin] = useState('')
  const [checkout, setCheckout] = useState('')
  const [guests, setGuests] = useState('2')
  const [room, setRoom] = useState('')
  const [breakfast, setBreakfast] = useState(true)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  useReveal()

  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('lang', lang) } catch { /* ignore */ }
  }, [lang])

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [menu])

  const goReserve = (e: FormEvent) => {
    e.preventDefault()
    document.getElementById('reserve')?.scrollIntoView({ behavior: 'smooth' })
    window.setTimeout(() => nameRef.current?.focus({ preventScroll: true }), 650)
  }

  const askRoom = (name: string) => setRoom(name)

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const v = (k: string) => String(f.get(k) ?? '').trim()
    const bad: Record<string, boolean> = {
      name: !v('name'),
      phone: !v('phone'),
      email: !/^\S+@\S+\.\S+$/.test(v('email')),
      checkin: !checkin,
      checkout: !checkout,
    }
    setErrors(bad)
    if (Object.values(bad).some(Boolean)) {
      setStatus({ kind: 'err', msg: t.form.errFields })
      return
    }
    if (checkout <= checkin) {
      setErrors({ checkout: true })
      setStatus({ kind: 'err', msg: t.form.errDates })
      return
    }
    const roomLabel = room || t.form.anyRoom
    const subject = `${t.form.mailSubject} — ${roomLabel} (${checkin} → ${checkout})`
    const body = [
      `${t.form.name}: ${v('name')}`,
      `${t.form.phone}: ${v('phone')}`,
      `Email: ${v('email')}`,
      `${t.form.checkin}: ${checkin}`,
      `${t.form.checkout}: ${checkout}`,
      `${t.form.guests}: ${guests}`,
      `${t.form.room}: ${roomLabel}`,
      `${t.form.note}: ${v('note') || '—'}`,
    ].join('\n')
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setStatus({ kind: 'ok', msg: t.form.ok })
  }

  const links: [string, string][] = [
    ['about', t.nav.about],
    ['rooms', t.nav.rooms],
    ['gallery', t.nav.gallery],
    ['location', t.nav.location],
    ['reserve', t.nav.contact],
  ]

  return (
    <>
      {/* ---------------- Header ---------------- */}
      <header className={`header${scrolled || menu ? ' solid' : ''}`}>
        <div className="wrap header-in">
          <a href="#top" className="brand" aria-label="Stellar Signature Hotel" onClick={() => setMenu(false)}>
            <Star />
            <span className="brand-name"><b>STELLAR</b><small>Signature Hotel</small></span>
          </a>
          <nav className="nav" aria-label={t.nav.aria}>
            {links.map(([id, label]) => (
              <a key={id} href={`#${id}`} className={`link${active === id ? ' active' : ''}`}>{label}</a>
            ))}
            <div className="lang" role="group" aria-label="Language">
              <button aria-pressed={lang === 'vi'} onClick={() => setLang('vi')}>VI</button>
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>EN</button>
            </div>
            <button
              className="burger" aria-label={menu ? t.nav.close : t.nav.open} aria-expanded={menu}
              aria-controls="sheet" onClick={() => setMenu((m) => !m)}
            ><span /><span /><span /></button>
          </nav>
        </div>
      </header>
      <div id="sheet" className={`sheet${menu ? ' open' : ''}`} aria-hidden={!menu}>
        {links.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="link" tabIndex={menu ? 0 : -1} onClick={() => setMenu(false)}>{label}</a>
        ))}
        <a href="#reserve" className="btn btn-gold btn-block" tabIndex={menu ? 0 : -1} onClick={() => setMenu(false)}>{t.cta.book}</a>
      </div>

      <main id="top">
        {/* ---------------- Hero ---------------- */}
        <section className="hero on-dark">
          <div className="wrap hero-grid">
            <div>
              <span className="eyebrow light">{t.hero.eyebrow}</span>
              <h1 className="h-display">
                {t.hero.h1a}
                <span className="script foil">{t.hero.h1b}</span>
              </h1>
              <p className="hero-lede">{t.hero.lede}</p>
              <div className="hero-cta">
                <a href="#reserve" className="btn btn-gold">{t.cta.book}</a>
                <a href="#rooms" className="btn btn-line">{t.cta.rooms}</a>
              </div>
            </div>
            <div className="hero-art">
              <div className="arch"><img src={facade} alt={t.hero.alt} width={1400} height={1050} fetchPriority="high" /></div>
              <div className="arch-frame" aria-hidden="true" />
              <Star className="hero-star" />
              <div className="hero-note"><b>Phú Mỹ Hưng</b>{t.hero.note}</div>
            </div>
          </div>
        </section>

        <div className="wrap avail-wrap">
          <form className="avail" onSubmit={goReserve} aria-label={t.avail.aria}>
            <div className="cell">
              <label htmlFor="a-in">{t.form.checkin}</label>
              <input id="a-in" type="date" min={today()} value={checkin} onChange={(e) => setCheckin(e.target.value)} required />
            </div>
            <div className="cell">
              <label htmlFor="a-out">{t.form.checkout}</label>
              <input id="a-out" type="date" min={checkin || today()} value={checkout} onChange={(e) => setCheckout(e.target.value)} required />
            </div>
            <div className="cell">
              <label htmlFor="a-g">{t.form.guests}</label>
              <select id="a-g" value={guests} onChange={(e) => setGuests(e.target.value)}>
                {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-gold">{t.avail.go}</button>
          </form>
        </div>

        {/* ---------------- About ---------------- */}
        <section id="about" className="pad">
          <div className="wrap about-grid">
            <div className="about-photo reveal">
              <img src={facade} alt={t.hero.alt} width={1400} height={1050} loading="lazy" />
            </div>
            <div className="about-body">
              <span className="eyebrow reveal">{t.about.eyebrow}</span>
              <h2 className="h-display reveal" style={{ ['--d' as string]: '60ms' }}>{t.about.h2a} <em>{t.about.h2b}</em></h2>
              <p className="reveal" style={{ ['--d' as string]: '120ms' }}>{t.about.p1}</p>
              <p className="reveal ph-line" style={{ ['--d' as string]: '160ms', marginTop: 16 }}>{t.about.p2}</p>
              <div className="facts reveal" style={{ ['--d' as string]: '220ms' }}>
                <div className="fact"><b>Quận 7</b><span>{t.about.f1}</span></div>
                <div className="fact"><b>{t.about.f2h}</b><span>{t.about.f2}</span></div>
                <div className="fact ph-text"><b className="ph-text">[ ? ]</b><span className="ph-text">{t.about.f3}</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- Rooms ---------------- */}
        <section id="rooms" className="pad on-dark" style={{ paddingBottom: 'clamp(64px, 9vw, 120px)' }}>
          <div className="wrap rooms-head">
            <div className="sec-head">
              <span className="eyebrow reveal">{t.rooms.eyebrow}</span>
              <h2 className="h-display reveal" style={{ ['--d' as string]: '60ms' }}>{t.rooms.h2a} <em>{t.rooms.h2b}</em></h2>
              <p className="reveal" style={{ ['--d' as string]: '120ms' }}>{t.rooms.lede}</p>
            </div>
            <div className="rooms-side reveal">
              <div className="seg" role="group" aria-label={t.rooms.bfLabel}>
                <button aria-pressed={breakfast} onClick={() => setBreakfast(true)}>{t.rooms.bfOn}</button>
                <button aria-pressed={!breakfast} onClick={() => setBreakfast(false)}>{t.rooms.bfOff}</button>
              </div>
              <p className="rooms-note">{t.rooms.note}</p>
            </div>
          </div>
          <div className="rooms-track" tabIndex={0} aria-label={t.rooms.eyebrow}>
            {ROOMS.map((r, i) => {
              const n = String(i + 1).padStart(2, '0')
              const name = r.name
              return (
                <article key={n} className="room">
                  <div className="room-img ph">
                    <span className="room-no">{n}</span>
                    <Star />
                    <span className="ph-tag">{t.rooms.photo}</span>
                  </div>
                  <div className="room-body">
                    <h3>{name}</h3>
                    <p className="room-spec">{r.size} m² · <span className="ph-text">{t.rooms.specPh}</span></p>
                    <div className="room-price">
                      <b>{money(breakfast ? r.withBf : r.noBf, lang)}</b><small>{t.rooms.night}</small>
                    </div>
                    <p className="room-vat">{breakfast ? t.rooms.bfOn : t.rooms.bfOff} · {t.rooms.vat}</p>
                    <a href="#reserve" className="btn btn-line btn-block" onClick={() => askRoom(name)}>{t.rooms.ask}</a>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* ---------------- Gallery ---------------- */}
        <section id="gallery" className="pad">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow reveal">{t.gallery.eyebrow}</span>
              <h2 className="h-display reveal" style={{ ['--d' as string]: '60ms' }}>{t.gallery.h2a} <em>{t.gallery.h2b}</em></h2>
            </div>
            <div className="gal">
              <figure className="tile t1 reveal"><img src={facade} alt={t.hero.alt} loading="lazy" /><figcaption>{t.gallery.c1}</figcaption></figure>
              <figure className="tile t2 reveal" style={{ ['--d' as string]: '70ms' }}><img src={columns} alt={t.gallery.c2} loading="lazy" /><figcaption>{t.gallery.c2}</figcaption></figure>
              <figure className="tile t3 reveal" style={{ ['--d' as string]: '140ms' }}><img src={arches} alt={t.gallery.c3} loading="lazy" style={{ objectPosition: '50% 20%' }} /><figcaption>{t.gallery.c3}</figcaption></figure>
              <div className="tile t4 ph ph-tile reveal">{t.gallery.ph}</div>
              <div className="tile t5 ph ph-tile reveal" style={{ ['--d' as string]: '70ms' }}>{t.gallery.ph}</div>
              <div className="tile t6 ph ph-tile reveal" style={{ ['--d' as string]: '140ms' }}>{t.gallery.ph}</div>
            </div>
          </div>
        </section>

        {/* ---------------- Location ---------------- */}
        <section id="location" className="pad on-olive">
          <div className="wrap loc-grid">
            <div>
              <div className="sec-head on-dark">
                <span className="eyebrow light reveal">{t.loc.eyebrow}</span>
                <h2 className="h-display reveal" style={{ ['--d' as string]: '60ms' }}>{t.loc.h2a} <em>{t.loc.h2b}</em></h2>
              </div>
              <ul className="loc-list reveal" style={{ ['--d' as string]: '120ms' }}>
                <li className="loc-item">{Icon.pin}<div><small>{t.loc.address}</small><span>{t.loc.addressValue}</span></div></li>
                <li className="loc-item">{Icon.phone}<div><small>{t.loc.phone}</small><a href={PHONE_HREF}>{PHONE}</a></div></li>
                <li className="loc-item">{Icon.mail}<div><small>Email</small><a href={`mailto:${EMAIL}`}>{EMAIL}</a></div></li>
              </ul>
              <div className="loc-actions reveal" style={{ ['--d' as string]: '180ms' }}>
                <a className="btn btn-gold" href={MAP_DIRECTIONS} target="_blank" rel="noopener">{t.loc.directions}</a>
                <a className="btn btn-line" href={PHONE_HREF}>{t.loc.call}</a>
              </div>
            </div>
            <div className="map reveal" style={{ ['--d' as string]: '100ms' }}>
              <iframe title={t.loc.mapTitle} src={MAP_SRC} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
            </div>
          </div>
        </section>

        {/* ---------------- Reserve ---------------- */}
        <section id="reserve" className="pad">
          <div className="wrap res-grid">
            <div>
              <div className="sec-head">
                <span className="eyebrow reveal">{t.res.eyebrow}</span>
                <h2 className="h-display reveal" style={{ ['--d' as string]: '60ms' }}>{t.res.h2a} <em>{t.res.h2b}</em></h2>
                <p className="reveal" style={{ ['--d' as string]: '120ms' }}>{t.res.lede}</p>
              </div>
              <ul className="perks reveal" style={{ ['--d' as string]: '180ms' }}>
                {t.res.perks.map((p) => <li key={p}>{Icon.check}<span>{p}</span></li>)}
              </ul>
            </div>
            <form className="form reveal" onSubmit={submit} noValidate style={{ ['--d' as string]: '100ms' }}>
              <div className="row">
                <div className={`field${errors.name ? ' bad' : ''}`}>
                  <label htmlFor="f-name">{t.form.name}</label>
                  <input ref={nameRef} id="f-name" name="name" autoComplete="name" required aria-invalid={!!errors.name} />
                </div>
                <div className={`field${errors.phone ? ' bad' : ''}`}>
                  <label htmlFor="f-phone">{t.form.phone}</label>
                  <input id="f-phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!errors.phone} />
                </div>
              </div>
              <div className={`field${errors.email ? ' bad' : ''}`}>
                <label htmlFor="f-email">Email</label>
                <input id="f-email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} />
              </div>
              <div className="row">
                <div className={`field${errors.checkin ? ' bad' : ''}`}>
                  <label htmlFor="f-in">{t.form.checkin}</label>
                  <input id="f-in" type="date" min={today()} value={checkin} onChange={(e) => setCheckin(e.target.value)} aria-invalid={!!errors.checkin} />
                </div>
                <div className={`field${errors.checkout ? ' bad' : ''}`}>
                  <label htmlFor="f-out">{t.form.checkout}</label>
                  <input id="f-out" type="date" min={checkin || today()} value={checkout} onChange={(e) => setCheckout(e.target.value)} aria-invalid={!!errors.checkout} />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="f-g">{t.form.guests}</label>
                  <select id="f-g" value={guests} onChange={(e) => setGuests(e.target.value)}>
                    {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="f-room">{t.form.room}</label>
                  <select id="f-room" value={room} onChange={(e) => setRoom(e.target.value)}>
                    <option value="">{t.form.anyRoom}</option>
                    {ROOMS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="f-note">{t.form.note}</label>
                <textarea id="f-note" name="note" placeholder={t.form.notePh} />
              </div>
              <button type="submit" className="btn btn-dark btn-block">{t.form.send}</button>
              <p className="form-note">{t.form.hint}</p>
              <div className={`status${status ? ` show ${status.kind}` : ''}`} role="status">{status?.msg}</div>
            </form>
          </div>
        </section>
      </main>

      {/* ---------------- Footer ---------------- */}
      <footer className="footer">
        <div className="wrap">
          <div className="foot-grid">
            <div>
              <img className="foot-logo" src={wordmark} alt="Stellar Signature Hotel" loading="lazy" />
              <p style={{ marginTop: 20, maxWidth: '34ch', fontSize: 14.5 }}>{t.foot.blurb}</p>
            </div>
            <div>
              <h4>{t.foot.explore}</h4>
              <ul>{links.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}</ul>
            </div>
            <div>
              <h4>{t.foot.contact}</h4>
              <ul>
                <li><a href={PHONE_HREF}>{PHONE}</a></li>
                <li><a href={`mailto:${EMAIL}`}>{EMAIL}</a></li>
                <li><a href={FACEBOOK} target="_blank" rel="noopener">Facebook</a></li>
                <li>{t.loc.addressValue}</li>
              </ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© {new Date().getFullYear()} Stellar Signature Hotel</span>
            <span>{t.foot.concept}</span>
          </div>
        </div>
      </footer>

      <nav className="dock" aria-label={t.nav.aria}>
        <a href={PHONE_HREF}>{t.loc.call}</a>
        <a href="#reserve">{t.cta.book}</a>
      </nav>
    </>
  )
}
