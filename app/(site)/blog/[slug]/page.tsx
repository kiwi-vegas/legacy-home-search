import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import imageUrlBuilder from '@sanity/image-url'
import { createClient } from '@sanity/client'
import { getBlogPost, getBlogPosts } from '@/sanity/queries'
import PortableText from '@/components/PortableText'
import BlogCommunityListings, { type CommunityKey } from '@/components/BlogCommunityListings'

export const revalidate = 60

const CATEGORY_LABELS: Record<string, string> = {
  'market-update': 'Market Update',
  'buying-tips': 'Buying Tips',
  'selling-tips': 'Selling Tips',
  'community-spotlight': 'Community Spotlight',
  investment: 'Investment',
  news: 'News',
}

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? '2nr7n3lm',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
const builder = imageUrlBuilder(sanityClient)

export async function generateStaticParams() {
  const posts = await getBlogPosts(100)
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) return { title: 'Post Not Found' }

  const title = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt ?? ''

  const ogImage = post.coverImage
    ? builder.image(post.coverImage).width(1200).height(630).fit('crop').url()
    : post.heroBannerImage
    ? builder.image(post.heroBannerImage).width(1200).height(630).fit('crop').url()
    : null

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://legacyhomesearch.com/blog/${slug}`,
      ...(ogImage && {
        images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  }
}

function detectCommunities(title: string, slug: string): CommunityKey[] {
  const text = `${title} ${slug}`.toLowerCase()
  const textNoHR = text.replace(/hampton[\s-]+roads?/gi, '')
  const found: CommunityKey[] = []
  if (text.includes('virginia beach') || text.includes('virginia-beach')) found.push('virginia-beach')
  if (text.includes('chesapeake')) found.push('chesapeake')
  if (text.includes('norfolk')) found.push('norfolk')
  if (textNoHR.includes('hampton')) found.push('hampton')
  if (text.includes('newport news') || text.includes('newport-news')) found.push('newport-news')
  if (text.includes('suffolk')) found.push('suffolk')
  return found
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPost(slug)
  if (!post) notFound()

  const imgUrl = post.coverImage
    ? builder.image(post.coverImage).width(1920).url()
    : null

  const heroBannerUrl = post.heroBannerImage
    ? builder.image(post.heroBannerImage).width(1920).url()
    : null

  const heroDisplayUrl = heroBannerUrl ?? imgUrl

  const pubDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  const category = CATEGORY_LABELS[post.category] ?? post.category
  const communities = detectCommunities(post.title, post.slug)

  return (
    <article className="blog-post">

      {/* ── HERO IMAGE ──────────────────────────────────────────────── */}
      {heroDisplayUrl && (
        heroBannerUrl ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 1', overflow: 'hidden' }}>
            <Image
              src={heroDisplayUrl}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        ) : (
          <div className="blog-post-hero">
            <Image
              src={heroDisplayUrl}
              alt={post.title}
              fill
              priority
              sizes="100vw"
              style={{ objectFit: 'cover', objectPosition: 'top center' }}
            />
            <div className="blog-post-hero-overlay" />
          </div>
        )
      )}

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div className="container">
        <div className="blog-post-header">
          {category && <span className="blog-card-category">{category}</span>}
          <h1 className="blog-post-title">{post.title}</h1>
          <div className="blog-post-meta">
            <span>Barry Jenkins</span>
            {pubDate && <><span className="blog-post-sep">·</span><span>{pubDate}</span></>}
            {post.aiGenerated && <span className="blog-ai-badge">AI-Assisted</span>}
          </div>
          {post.excerpt && <p className="blog-post-excerpt">{post.excerpt}</p>}
        </div>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        {post.body && (
          <div className="blog-post-body">
            <PortableText value={post.body} />
          </div>
        )}

      </div>

      {/* ── COMMUNITY LISTINGS ──────────────────────────────────────── */}
      <BlogCommunityListings communities={communities} />

      <div className="container">
        {/* ── BACK LINK ───────────────────────────────────────────────── */}
        <div className="blog-post-footer">
          <a href="/blog" className="btn-outline">← Back to Blog</a>
        </div>
      </div>

    </article>
  )
}
