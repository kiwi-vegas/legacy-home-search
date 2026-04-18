'use client'

interface Testimonial {
  quote: string
  name: string
  detail: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Barry made the whole process so smooth. From our first call to closing day, he kept us informed and never pushed us into anything we weren't comfortable with. We found our dream home in Virginia Beach in under three weeks.",
    name: "Sarah & Mike T.",
    detail: "Bought in Virginia Beach",
  },
  {
    quote: "I was relocating from out of state and had no idea where to start. Barry took the time to walk me through every neighborhood in Hampton Roads. Couldn't have done it without him.",
    name: "James R.",
    detail: "Relocated to Chesapeake",
  },
  {
    quote: "Our home sold in 4 days with multiple offers above asking. Barry priced it perfectly and the marketing was top notch. The photos and listing looked incredible.",
    name: "Lisa & David M.",
    detail: "Sold in Norfolk",
  },
  {
    quote: "First-time homebuyer here — I was intimidated by the whole process but the team made it feel easy. They explained everything step by step and were always available to answer questions.",
    name: "Kayla B.",
    detail: "First-time buyer, Suffolk",
  },
  {
    quote: "We've bought and sold three homes with Legacy Home Team over the years. The consistency and professionalism are unmatched in Hampton Roads. Wouldn't use anyone else.",
    name: "Tom & Angela F.",
    detail: "Repeat clients, Virginia Beach",
  },
  {
    quote: "Barry found us an off-market property in our price range when we thought there was nothing available. His network and knowledge of the local market are genuinely impressive.",
    name: "Marcus W.",
    detail: "Bought in Newport News",
  },
  {
    quote: "The whole team is responsive and professional. We had a complicated transaction with a contingency sale and they handled it flawlessly. Everything closed on time.",
    name: "Renee & Carlos S.",
    detail: "Sold & bought in Hampton",
  },
  {
    quote: "I've referred Barry to three of my friends and every single one of them came back to thank me. He genuinely cares about getting the right outcome for his clients.",
    name: "Patricia L.",
    detail: "Virginia Beach",
  },
  {
    quote: "From our very first showing to signing the final papers, this team was incredible. Very knowledgeable about the market and helped us negotiate a great deal.",
    name: "Derek & Monique H.",
    detail: "Bought in Chesapeake",
  },
]

const COLUMN_SPLITS: [number[], number[], number[]] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
]

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-xl)',
      padding: '28px 28px 24px',
      marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <p style={{
        fontSize: 15,
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
        marginBottom: 20,
        fontStyle: 'italic',
      }}>
        &ldquo;{t.quote}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)', fontWeight: 800, fontSize: 15, flexShrink: 0,
        }}>
          {t.name[0]}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{t.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.detail}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: '#f59e0b', fontSize: 13 }}>★</span>
          ))}
        </div>
      </div>
    </div>
  )
}

function TestimonialsColumn({ indices, duration, delay = 0 }: { indices: number[]; duration: number; delay?: number }) {
  const items = indices.map(i => TESTIMONIALS[i])
  return (
    <div style={{ overflow: 'hidden', minWidth: 0 }}>
      <div style={{
        animation: `testimonialScrollUp ${duration}s linear ${delay}s infinite`,
        willChange: 'transform',
      }}>
        {[...items, ...items].map((t, i) => (
          <TestimonialCard key={i} t={t} />
        ))}
      </div>
    </div>
  )
}

export default function AgentTestimonials() {
  return (
    <>
      <style>{`
        @keyframes testimonialScrollUp {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
      `}</style>
      <section style={{ paddingTop: 80, paddingBottom: 80 }}>
        <div className="container">
          <div className="section-header">
            <span className="section-label">Client Reviews</span>
            <h2>What My Clients Say</h2>
            <p>Real stories from real Hampton Roads homebuyers and sellers.</p>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            height: 600,
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
          }}>
            <TestimonialsColumn indices={COLUMN_SPLITS[0]} duration={28} />
            <TestimonialsColumn indices={COLUMN_SPLITS[1]} duration={32} delay={1.5} />
            <TestimonialsColumn indices={COLUMN_SPLITS[2]} duration={25} delay={0.8} />
          </div>
        </div>
      </section>
    </>
  )
}
