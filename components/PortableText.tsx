import { PortableText as SanityPortableText } from 'next-sanity'

const components = {
  block: {
    normal: ({ children }: any) => (
      <p style={{ fontSize: '16px', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '20px' }}>
        {children}
      </p>
    ),
    h2: ({ children }: any) => (
      <h2 style={{ color: 'var(--text)', marginBottom: '16px', marginTop: '32px' }}>
        {children}
      </h2>
    ),
    h3: ({ children }: any) => (
      <h3 style={{ color: 'var(--text)', marginBottom: '12px', marginTop: '24px' }}>
        {children}
      </h3>
    ),
  },
  marks: {
    strong: ({ children }: any) => <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{children}</strong>,
    em: ({ children }: any) => <em style={{ color: 'var(--accent)' }}>{children}</em>,
    link: ({ children, value }: any) => (
      <a href={value?.href} style={{ color: 'var(--accent)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
}

export default function PortableText({ value }: { value: any[] }) {
  return <SanityPortableText value={value} components={components} />
}
