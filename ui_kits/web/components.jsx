// SoundBaze — Web UI Kit components
// All components defined here, exported to window at the bottom for cross-script access.

const { useState, useMemo, useEffect } = React;
const Icon = window.Icon;
const DATA = window.SOUNDBAZE_DATA;

// ============================================================================
// Primitives
// ============================================================================

function Button({ variant = "primary", size, pill, children, onClick, leftIcon, rightIcon }) {
  const cls = ["btn", `btn-${variant}`, size && `btn-${size}`, pill && "btn-pill"]
    .filter(Boolean).join(" ");
  return (
    <button className={cls} onClick={onClick}>
      {leftIcon}{children}{rightIcon}
    </button>
  );
}

function Pill({ variant = "neutral", children, dot }) {
  return (
    <span className={`pill pill-${variant}`}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />}
      {children}
    </span>
  );
}

function IconButton({ icon, onClick, ariaLabel }) {
  return (
    <button className="icon-btn" onClick={onClick} aria-label={ariaLabel}>{icon}</button>
  );
}

function Avatar({ initial, size = 32, color }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: color }}>
      {initial}
    </div>
  );
}

function AlbumCover({ src, size = 56, radius }) {
  return (
    <div className="album-cover" style={{ width: size, height: size, borderRadius: radius }}>
      <img src={src} alt="" />
    </div>
  );
}

// ============================================================================
// Chrome
// ============================================================================

function TopNav({ route, navigate }) {
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const submit = (e) => {
    if (e.key === "Enter" && q.trim()) navigate({ name: "search", q: q.trim() });
  };
  return (
    <nav className="nav">
      <div className="nav-brand" onClick={() => navigate({ name: "home" })}>
        <svg width="24" height="24" viewBox="0 0 120 120">
          <g fill="#C9462C">
            <rect x="10" y="68" width="14" height="38" rx="6" />
            <rect x="34" y="32" width="14" height="74" rx="6" />
            <rect x="58" y="50" width="14" height="56" rx="6" />
            <rect x="82" y="20" width="14" height="86" rx="6" />
            <rect x="106" y="60" width="14" height="46" rx="6" />
          </g>
        </svg>
        <span className="nav-brand-word">soundbaze</span>
      </div>
      <div className="nav-links">
        {[["Songs", "home"], ["Artists", "artist"], ["Albums", "home"], ["Community", "home"]].map(([label, name]) => (
          <span key={label} className={`nav-link ${route.name === name ? "active" : ""}`} onClick={() => navigate({ name })}>
            {label}
          </span>
        ))}
      </div>
      <div className="nav-right">
        <div className={`search-pill ${focused ? "focused" : ""}`}>
          <Icon.Search size={16} />
          <input
            placeholder="Find a song, artist, or lyric"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={submit}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </div>
        <Button variant="primary" size="sm" pill>Sign in</Button>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 120 120">
              <g fill="#C9462C">
            <rect x="10" y="68" width="14" height="38" rx="6" />
            <rect x="34" y="32" width="14" height="74" rx="6" />
            <rect x="58" y="50" width="14" height="56" rx="6" />
            <rect x="82" y="20" width="14" height="86" rx="6" />
            <rect x="106" y="60" width="14" height="46" rx="6" />
          </g>
            </svg>
            <span style={{ fontWeight: 700, fontSize: 24, letterSpacing: "-0.03em" }}>soundbaze</span>
          </div>
          <p className="footer-tag">Every song has a second layer. SoundBaze is where you read it, write it, and sit with it — built first for Ghanaian music.</p>
        </div>
        <div className="footer-col"><h4>Product</h4><a>Songs</a><a>Artists</a><a>Albums</a><a>Annotate</a></div>
        <div className="footer-col"><h4>Community</h4><a>Contributors</a><a>Guidelines</a><a>Verified artists</a></div>
        <div className="footer-col"><h4>Company</h4><a>About</a><a>Press</a><a>Careers</a><a>Contact</a></div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 SoundBaze</span>
        <span>Privacy · Terms · Cookies</span>
      </div>
    </footer>
  );
}

// ============================================================================
// Marketing — Home
// ============================================================================

function Hero({ navigate }) {
  // 12 monochrome album covers — duplicated to make a seamless marquee loop
  const covers = Array.from({ length: 12 }, (_, i) =>
    `../../assets/album-art/cover-${String(i + 1).padStart(2, "0")}.svg`
  );
  const tiles = [...covers, ...covers];
  return (
    <section className="hero">
      <div className="hero-carousel" aria-hidden="true">
        <div className="hero-marquee">
          {tiles.map((src, i) => (
            <div key={i} className="hero-cover">
              <img src={src} alt="" />
            </div>
          ))}
        </div>
      </div>
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-content">
        <span className="hero-eyebrow">New releases · this week</span>
        <h1 className="hero-headline">Every song<br/>has a <em>second</em><br/>layer.</h1>
        <p className="hero-lead">Charley, SoundBaze is where you find it. Line-by-line annotations for the music you grew up on — hiplife, drill, alté, gospel highlife — read by the people who actually know the songs.</p>
        <div className="hero-cta">
          <Button variant="primary" size="lg" onClick={() => navigate({ name: "song", id: "abrokyire-blues" })}>Find a song</Button>
          <Button variant="ghost" size="lg">How it works</Button>
        </div>
      </div>
    </section>
  );
}

function KenteBand({ thickness = "" }) {
  return <div className={`kente-band ${thickness}`} aria-hidden="true" />;
}

function TrendingGrid({ navigate }) {
  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>This week</div>
          <h2 className="section-title">Trending close reads</h2>
        </div>
        <a className="btn-link" style={{ fontSize: 14 }}>See all →</a>
      </div>
      <div className="trending-grid">
        {DATA.songs.map((s, i) => (
          <div key={s.id} className="song-row" onClick={() => navigate({ name: "song", id: s.id })}>
            <span className="song-row-rank">{String(i + 1).padStart(2, "0")}</span>
            <AlbumCover src={s.cover} size={56} />
            <div className="song-row-meta">
              <div className="song-row-title">{s.title}</div>
              <div className="song-row-sub">{s.artist} · {s.album}</div>
              <div className="song-row-pills">
                <Pill variant="accent">{s.annotationCount} annotations</Pill>
                <Pill variant="neutral">{s.reads} reads</Pill>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeatureRow() {
  return (
    <section className="container">
      <div className="feature-row">
        <div className="feature-art">
          <svg width="280" height="200" viewBox="0 0 360 240" fill="none" stroke="var(--charcoal-brown)" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="120" cy="120" r="78" strokeWidth="3"/>
            <circle cx="120" cy="120" r="58" strokeWidth="1.5" strokeDasharray="2 6"/>
            <circle cx="120" cy="120" r="38" strokeWidth="1.5"/>
            <circle cx="120" cy="120" r="10" fill="#C9462C" stroke="none"/>
            <circle cx="120" cy="120" r="3" fill="var(--charcoal-brown)" stroke="none"/>
            <path d="M220 80 L220 160" strokeWidth="3.5" stroke="#C9462C"/>
            <path d="M240 60 L240 180" strokeWidth="3.5" stroke="#C9462C"/>
            <path d="M260 90 L260 150" strokeWidth="3.5"/>
            <path d="M280 70 L280 170" strokeWidth="3.5"/>
            <path d="M300 95 L300 145" strokeWidth="3.5"/>
            <path d="M320 80 L320 160" strokeWidth="3.5" stroke="#C9462C"/>
          </svg>
        </div>
        <div>
          <div className="feature-eyebrow">Slow reading</div>
          <h2 className="feature-title">A quieter way to read Ghanaian music.</h2>
          <p className="feature-body">No flashing comments. No screaming banners. SoundBaze strips lyric pages back to the words — Twi, Ga, Hausa, Pidgin, English — and the people who care enough to break them down.</p>
          <div style={{ marginTop: 20 }}><Button variant="ghost" rightIcon={<Icon.ArrowRight size={16} />}>Read the manifesto</Button></div>
        </div>
      </div>
      <div className="feature-row" style={{ direction: "rtl" }}>
        <div className="feature-art" style={{ direction: "ltr", background: "var(--charcoal-brown)", color: "var(--floral-white)" }}>
          <div style={{ maxWidth: 360 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--paprika-tint-2)" }}>Annotation · 1 of 2</div>
            <div style={{ fontSize: 20, fontWeight: 500, fontStyle: "italic", marginTop: 12, opacity: 0.92 }}>"counting the cracks in the ceiling"</div>
            <div style={{ fontSize: 14, lineHeight: 1.55, marginTop: 14, opacity: 0.85 }}>A direct echo of the second track on her debut EP — same image, six years later, but now it's exhaustion rather than wonder.</div>
            <div style={{ fontSize: 12, marginTop: 20, opacity: 0.65 }}>by @maeve · 412 ↑</div>
          </div>
        </div>
        <div style={{ direction: "ltr" }}>
          <div className="feature-eyebrow">Annotations</div>
          <h2 className="feature-title">Tap a line.<br/>Hear the room.</h2>
          <p className="feature-body">Every highlighted line opens a quiet panel — context from contributors who've sat with the song longer than most. With inline translations when the line switches languages mid-bar.</p>
          <div style={{ marginTop: 20 }}><Button variant="ghost" rightIcon={<Icon.ArrowRight size={16} />}>How annotations work</Button></div>
        </div>
      </div>
    </section>
  );
}

function CommunityList() {
  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>Right now</div>
          <h2 className="section-title">The community is reading</h2>
        </div>
      </div>
      <div className="contrib-list">
        {DATA.community.map((c, i) => (
          <div key={i} className="contrib-row">
            <Avatar initial={c.avatar} />
            <div className="contrib-body">
              <strong>@{c.author}</strong> {c.action} <em>"{c.line}"</em> on <strong>{c.song}</strong>
            </div>
            {c.upvotes > 0 && <Pill variant="neutral"><Icon.ArrowUp size={12} /> {c.upvotes}</Pill>}
            <span className="contrib-time">{c.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Song page
// ============================================================================

function SongHeader({ song, navigate }) {
  return (
    <section className="song-header">
      <div className="container song-header-inner">
        <div className="song-header-cover"><img src={song.cover} alt="" /></div>
        <div>
          <div className="song-header-eyebrow">Song · annotated</div>
          <h1 className="song-header-title">{song.title}</h1>
          <div className="song-header-artist" style={{ cursor: "pointer" }} onClick={() => navigate({ name: "artist", id: song.artistId })}>
            {song.artist}
          </div>
          <div className="song-header-meta">
            <span>{song.album}</span><span className="dot"/>
            <span>{song.year}</span><span className="dot"/>
            <span>{song.duration}</span><span className="dot"/>
            <span>{song.annotationCount} annotations</span>
          </div>
          <div className="song-header-cta">
            <Button variant="primary" leftIcon={<Icon.Play size={16} strokeWidth={2} />}>Play</Button>
            <Button variant="ghost" style={{ color: "var(--floral-white)", borderColor: "rgba(250,246,238,0.3)" }} leftIcon={<Icon.Bookmark size={16} />}>Save</Button>
            <IconButton icon={<Icon.Share size={18} />} />
            <IconButton icon={<Icon.More size={18} />} />
          </div>
        </div>
      </div>
    </section>
  );
}

function LyricLine({ line, activeId, onAnnotate }) {
  if (line.type === "section") {
    return <div className="lyric-section">{line.label}</div>;
  }
  // Render with annotation spans
  if (line.annotations && line.annotations.length) {
    const ann = line.annotations[0];
    const full = line.full || line.text;
    const annText = full.substring(ann.from, ann.to);
    const before = full.substring(0, ann.from);
    const after = full.substring(ann.to);
    return (
      <span className="lyric-line">
        {before}
        <span
          className={`ann ${activeId === ann.id ? "active" : ""}`}
          onClick={() => onAnnotate(ann.id)}
        >
          {annText}
        </span>
        {after}<br/>
      </span>
    );
  }
  return <span className="lyric-line">{line.text}<br/></span>;
}

function AnnotationPanel({ ann, onClose }) {
  if (!ann) {
    return (
      <div className="ann-empty">
        <strong>No annotation selected.</strong>
        Tap any underlined line to read what people have figured out about it.
      </div>
    );
  }
  return (
    <aside className="ann-panel">
      <div className="ann-panel-head">
        <span>Annotation</span>
        <IconButton icon={<Icon.X size={16} />} onClick={onClose} ariaLabel="Close" />
      </div>
      <div className="ann-quote">"{ann.quote}"</div>
      <div className="ann-body">{ann.body}</div>
      <div className="ann-by">
        <Avatar initial={ann.avatar} color="var(--accent)" />
        <div>
          <div className="ann-by-name">@{ann.author}</div>
          <div className="ann-by-meta">Top contributor</div>
        </div>
        <span className="ann-by-vote"><Icon.ArrowUp size={12} /> {ann.upvotes}</span>
      </div>
    </aside>
  );
}

function SongPage({ song, navigate }) {
  const [activeId, setActiveId] = useState(null);
  const ann = activeId ? song.annotations?.[activeId] : null;
  return (
    <>
      <SongHeader song={song} navigate={navigate} />
      <KenteBand thickness="kente-band-thick" />
      <div className="container">
        <div className="reader-wrap">
          <div className="lyric-card">
            {song.lyrics?.map((line, i) => (
              <LyricLine key={i} line={line} activeId={activeId} onAnnotate={setActiveId} />
            ))}
          </div>
          <AnnotationPanel ann={ann} onClose={() => setActiveId(null)} />
        </div>
      </div>
      <button className="float-cta" onClick={() => setActiveId("a1")}>
        <Icon.Edit size={16} /> Annotate a line
      </button>
    </>
  );
}

// ============================================================================
// Artist page
// ============================================================================

function ArtistPage({ artist, navigate }) {
  const topSongs = artist.topSongs.map((id) => DATA.songs.find((s) => s.id === id)).filter(Boolean);
  return (
    <>
      <section className="artist-hero">
        <div className="container artist-hero-inner">
          <div className="artist-hero-img"><img src={artist.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.8 }}>Artist</div>
            <h1 className="artist-hero-name">{artist.name}</h1>
            <p className="artist-hero-bio">{artist.bio}</p>
            <div className="artist-hero-stats">
              <div><div className="stat-label">Followers</div><div className="stat-value">{artist.followers}</div></div>
              <div><div className="stat-label">Monthly readers</div><div className="stat-value">{artist.monthly}</div></div>
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <Button variant="secondary" pill>Follow</Button>
              <Button variant="ghost" pill style={{ color: "var(--floral-white)", borderColor: "rgba(250,246,238,0.3)" }}>Share</Button>
            </div>
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-head">
          <h2 className="section-title">Top songs</h2>
          <span className="section-sub">Most-read this month</span>
        </div>
        <div className="trending-grid">
          {topSongs.map((s, i) => (
            <div key={s.id} className="song-row" onClick={() => navigate({ name: "song", id: s.id })}>
              <span className="song-row-rank">{String(i + 1).padStart(2, "0")}</span>
              <AlbumCover src={s.cover} size={56} />
              <div className="song-row-meta">
                <div className="song-row-title">{s.title}</div>
                <div className="song-row-sub">{s.album} · {s.year}</div>
                <div className="song-row-pills">
                  <Pill variant="accent">{s.annotationCount} annotations</Pill>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ============================================================================
// Search results
// ============================================================================

function SearchResults({ q, navigate }) {
  const [tab, setTab] = useState("all");
  const results = useMemo(() => {
    const ql = q.toLowerCase();
    return DATA.songs.filter((s) =>
      s.title.toLowerCase().includes(ql) ||
      s.artist.toLowerCase().includes(ql) ||
      s.album.toLowerCase().includes(ql)
    );
  }, [q]);
  return (
    <section className="container search-page">
      <h1>Results for <em style={{ color: "var(--accent)", fontStyle: "normal" }}>"{q}"</em></h1>
      <div className="sub">{results.length} matches across songs and artists.</div>
      <div className="search-tabs">
        {["all", "songs", "artists", "annotations"].map((t) => (
          <span key={t} className={`search-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </span>
        ))}
      </div>
      <div className="search-results-list">
        {results.map((s) => (
          <div key={s.id} className="song-row" onClick={() => navigate({ name: "song", id: s.id })}>
            <AlbumCover src={s.cover} size={56} />
            <div className="song-row-meta">
              <div className="song-row-title">{s.title}</div>
              <div className="song-row-sub">{s.artist} · {s.album} · {s.year}</div>
              <div className="song-row-pills">
                <Pill variant="accent">{s.annotationCount} annotations</Pill>
                <Pill variant="neutral">{s.duration}</Pill>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Export
// ============================================================================
Object.assign(window, {
  Button, Pill, IconButton, Avatar, AlbumCover,
  TopNav, Footer, Hero, KenteBand, TrendingGrid, FeatureRow, CommunityList,
  SongHeader, LyricLine, AnnotationPanel, SongPage,
  ArtistPage, SearchResults,
});
