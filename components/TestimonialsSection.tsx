'use client'
import { motion } from 'motion/react'
import { TestimonialsColumn, type Testimonial } from '@/components/ui/testimonials-columns-1'

const testimonials: Testimonial[] = [
  {
    text: "Barry and his team helped us find our dream home in Virginia Beach in under two weeks. Their market knowledge was unmatched — they knew which neighborhoods were trending before we even asked.",
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Sarah & Mike T.',
    role: 'First-time buyers · Virginia Beach',
  },
  {
    text: "Sold our Chesapeake home in 9 days over asking price. Barry's pricing strategy and marketing plan were exactly right. We walked away with more than we expected.",
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'David R.',
    role: 'Seller · Chesapeake',
  },
  {
    text: "Relocating from DC for a military assignment was stressful, but Barry made the housing piece seamless. He knew exactly what military families need near NAS Oceana.",
    image: 'https://randomuser.me/api/portraits/men/46.jpg',
    name: 'Lt. Cmdr. James H.',
    role: 'Military relocation · Virginia Beach',
  },
  {
    text: "As first-time investors, we were nervous about buying a rental property. Barry walked us through every step and helped us find a Norfolk property that cash-flows from day one.",
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    name: 'Priya & Raj K.',
    role: 'Investors · Norfolk',
  },
  {
    text: "We'd been trying to sell our Suffolk home for months with another agent. Barry took over, repackaged the listing, and had it under contract in 11 days.",
    image: 'https://randomuser.me/api/portraits/women/17.jpg',
    name: 'Teresa W.',
    role: 'Seller · Suffolk',
  },
  {
    text: "Barry was honest when other agents just told us what we wanted to hear. That honesty saved us from a bad purchase and led us to the perfect home in Hampton.",
    image: 'https://randomuser.me/api/portraits/men/55.jpg',
    name: 'Marcus & Linda J.',
    role: 'Buyers · Hampton',
  },
  {
    text: "The Legacy team's knowledge of Newport News neighborhoods is incredible. They helped us find a home near the best schools and within our budget — something we thought was impossible.",
    image: 'https://randomuser.me/api/portraits/women/29.jpg',
    name: 'Carla M.',
    role: 'Buyer · Newport News',
  },
  {
    text: "Barry negotiated hard and saved us $14,000 off the list price. His persistence and relationships with local agents made all the difference in a competitive situation.",
    image: 'https://randomuser.me/api/portraits/men/11.jpg',
    name: 'Tom & Alicia B.',
    role: 'Buyers · Chesapeake',
  },
  {
    text: "From our first call to closing, the Legacy team was responsive, professional, and genuinely cared about our outcome. I've already referred three friends to them.",
    image: 'https://randomuser.me/api/portraits/women/54.jpg',
    name: 'Nicole S.',
    role: 'Seller & buyer · Virginia Beach',
  },
]

const firstColumn = testimonials.slice(0, 3)
const secondColumn = testimonials.slice(3, 6)
const thirdColumn = testimonials.slice(6, 9)

export default function TestimonialsSection() {
  return (
    <section style={{ background: 'var(--off-white)', overflow: 'hidden' }}>
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="section-header"
        >
          <span className="section-label">Client Stories</span>
          <h2>What Our Clients Say</h2>
          <p>Don&apos;t take our word for it — hear from the families we&apos;ve helped across Hampton Roads.</p>
        </motion.div>

        {/* Scrolling columns */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 20,
            maxHeight: 680,
            overflow: 'hidden',
            maskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)',
          }}
        >
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
          <TestimonialsColumn testimonials={secondColumn} duration={22} className="testimonials-col-md" />
          <TestimonialsColumn testimonials={thirdColumn} duration={20} className="testimonials-col-lg" />
        </div>
      </div>
    </section>
  )
}
