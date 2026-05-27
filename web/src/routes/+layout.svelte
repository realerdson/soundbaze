<script lang="ts">
  import '../app.css';
  import { page }  from '$app/stores';
  import Toast     from '$lib/components/Toast.svelte';

  let { children, data } = $props();

  const user = $derived(data?.user ?? null);

  let searchQ = $state('');
  let searchFocused = $state(false);

  function handleSearch(e: KeyboardEvent) {
    if (e.key === 'Enter' && searchQ.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQ.trim())}`;
    }
  }
</script>

<div class="shell">
  <!-- Top Nav -->
  <nav class="nav">
    <a href="/" class="nav-brand">
      <svg width="22" height="22" viewBox="0 0 120 120" aria-hidden="true">
        <g fill="var(--accent)">
          <rect x="10" y="68" width="14" height="38" rx="6"/>
          <rect x="34" y="32" width="14" height="74" rx="6"/>
          <rect x="58" y="50" width="14" height="56" rx="6"/>
          <rect x="82" y="20" width="14" height="86" rx="6"/>
          <rect x="106" y="60" width="14" height="46" rx="6"/>
        </g>
      </svg>
      <span class="nav-brand-word">soundbaze</span>
    </a>

    <ul class="nav-links">
      <li><a href="/" class="nav-link" class:active={$page.url.pathname === '/'}>Songs</a></li>
      <li><a href="/artists" class="nav-link" class:active={$page.url.pathname.startsWith('/artists')}>Artists</a></li>
      <li><a href="/albums" class="nav-link">Albums</a></li>
      <li><a href="/community" class="nav-link">Community</a></li>
    </ul>

    <div class="nav-right">
      <div class="search-pill" class:focused={searchFocused}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="search"
          placeholder="Find a song, artist, or lyric"
          bind:value={searchQ}
          onkeydown={handleSearch}
          onfocus={() => (searchFocused = true)}
          onblur={() => (searchFocused = false)}
        />
      </div>
      {#if user}
        <div class="nav-user">
          <a href="/dashboard" class="nav-avatar" title="Your dashboard">
            {(user.email?.[0] ?? '?').toUpperCase()}
          </a>
          <form method="POST" action="/auth/signout">
            <button type="submit" class="nav-signout" title="Sign out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </form>
        </div>
      {:else}
        <a href="/login" class="btn btn-primary btn-sm btn-pill">Sign in</a>
      {/if}
    </div>
  </nav>

  <!-- Page content -->
  <main style="flex: 1">
    {@render children()}
  </main>

  <!-- Global toast notifications -->
  <Toast />

  <!-- Footer -->
  <footer class="footer">
    <div class="container footer-inner">
      <div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <svg width="26" height="26" viewBox="0 0 120 120" aria-hidden="true">
            <g fill="var(--accent)">
              <rect x="10" y="68" width="14" height="38" rx="6"/>
              <rect x="34" y="32" width="14" height="74" rx="6"/>
              <rect x="58" y="50" width="14" height="56" rx="6"/>
              <rect x="82" y="20" width="14" height="86" rx="6"/>
              <rect x="106" y="60" width="14" height="46" rx="6"/>
            </g>
          </svg>
          <span style="font-weight: 700; font-size: 22px; letter-spacing: -0.03em;">soundbaze</span>
        </div>
        <p class="footer-tag">Every song has a second layer. SoundBaze is where you read it, write it, and sit with it — built first for Ghanaian music.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="/">Songs</a>
        <a href="/artists">Artists</a>
        <a href="/albums">Albums</a>
        <a href="/annotate">Annotate</a>
      </div>
      <div class="footer-col">
        <h4>Community</h4>
        <a href="/contributors">Contributors</a>
        <a href="/guidelines">Guidelines</a>
        <a href="/verified">Verified artists</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="/about">About</a>
        <a href="/press">Press</a>
        <a href="/careers">Careers</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <span>© 2026 SoundBaze</span>
      <span>Privacy · Terms · Cookies</span>
    </div>
  </footer>
</div>

<style>
  .nav-user {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .nav-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: var(--charcoal-brown);
    color: var(--floral-white);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: opacity 140ms;
    border: 2px solid transparent;
  }
  .nav-avatar:hover { opacity: 0.85; border-color: var(--accent); }
  .nav-signout {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--fg-subtle);
    cursor: pointer;
    transition: color 140ms, background 140ms;
    padding: 0;
  }
  .nav-signout:hover { color: var(--fg); background: var(--bg-sunken); }
</style>
