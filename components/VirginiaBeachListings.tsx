'use client'

export default function VirginiaBeachListings() {
  return (
    <section id="listings" style={{ background: 'var(--off-white)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-label">Browse</span>
          <h2>Homes For Sale in Virginia Beach</h2>
          <p>Live MLS listings updated daily — houses and condos across Virginia Beach starting at $400K.</p>
        </div>
        <div className="ylopo-wrap">
          <div
            className="YLOPO_resultsWidget"
            data-search='{"locations":[{"city":"Virginia Beach","state":"VA"}],"propertyTypes":["house","condo"],"minPrice":400000,"limit":12}'
          />
        </div>
        <div className="listings-actions">
          <a
            href="https://search.legacyhomesearch.com/search?s[orderBy]=sourceCreationDate%2Cdesc&s[page]=1&s[locations][0][city]=Virginia+Beach&s[locations][0][state]=VA"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            View All Virginia Beach Homes →
          </a>
        </div>
      </div>
    </section>
  )
}
