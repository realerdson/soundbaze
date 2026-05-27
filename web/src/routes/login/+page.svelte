<script lang="ts">
  import { onMount }       from 'svelte';
  import type { PageData } from './$types';
  import { SUPABASE_CONFIGURED, getSupabaseBrowser } from '$lib/supabase-browser';

  let { data }: { data: PageData } = $props();

  let email   = $state('');
  let sent    = $state(false);
  let loading = $state(false);
  let authErr = $state<string | null>(null);

  // Handle error param passed from auth callback
  $effect(() => {
    if (data.error === 'auth_failed') {
      authErr = 'Sign-in link expired or already used. Try again.';
    }
  });

  // Initialise Supabase browser client lazily (onMount = browser-only)
  let supabase: ReturnType<typeof getSupabaseBrowser> | null = null;
  onMount(() => {
    if (SUPABASE_CONFIGURED) supabase = getSupabaseBrowser();
  });

  async function loginWithGoogle() {
    if (!supabase) return;
    authErr = null;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(data.next)}` },
    });
    if (error) authErr = error.message;
  }

  async function sendMagicLink() {
    if (!email.trim()) return;
    authErr = null;
    loading = true;

    if (supabase) {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(data.next)}` },
      });
      if (error) { authErr = error.message; loading = false; return; }
    } else {
      // Dev mode — no Supabase configured, simulate the flow
      await new Promise(r => setTimeout(r, 600));
    }

    sent    = true;
    loading = false;
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') sendMagicLink();
  }
</script>

<svelte:head>
  <title>Sign in · SoundBaze</title>
</svelte:head>

<div class="login-shell">
  <!-- Left — brand panel -->
  <div class="login-brand">
    <div class="login-brand-inner">
      <a href="/" class="login-logo">
        <svg width="36" height="36" viewBox="0 0 120 120" aria-hidden="true">
          <g fill="var(--accent)">
            <rect x="10" y="68" width="14" height="38" rx="6"/>
            <rect x="34" y="32" width="14" height="74" rx="6"/>
            <rect x="58" y="50" width="14" height="56" rx="6"/>
            <rect x="82" y="20" width="14" height="86" rx="6"/>
            <rect x="106" y="60" width="14" height="46" rx="6"/>
          </g>
        </svg>
        <span>soundbaze</span>
      </a>

      <blockquote class="login-quote">
        "Every song has a second layer.<br/>SoundBaze is where you read it."
      </blockquote>

      <!-- Adinkra motif — Sankofa -->
      <div class="login-adinkra" aria-hidden="true">
        <svg viewBox="0 0 200 200" width="160" height="160" opacity="0.18">
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" stroke-width="4"/>
          <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="6 8"/>
          <circle cx="100" cy="100" r="28" fill="none" stroke="currentColor" stroke-width="3"/>
          <circle cx="100" cy="100" r="8" fill="currentColor"/>
          <path d="M100 20 L100 100 M100 100 L160 60 M100 100 L40 60" stroke="currentColor" stroke-width="3" fill="none"/>
        </svg>
      </div>

      <div class="login-tagline">
        Ghanaian music · annotations · community
      </div>
    </div>
  </div>

  <!-- Right — auth form -->
  <div class="login-form-side">
    <div class="login-card">
      {#if sent}
        <!-- Sent state -->
        <div class="login-sent">
          <div class="login-sent-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2>Check your email</h2>
          <p>We sent a magic link to <strong>{email}</strong>. Click it to sign in — no password needed.</p>
          <button class="btn btn-ghost" style="margin-top: 12px;" onclick={() => { sent = false; email = ''; }}>
            Use a different email
          </button>
        </div>
      {:else}
        <h1 class="login-title">Sign in to SoundBaze</h1>
        <p class="login-sub">Join the community reading Ghanaian music deeper.</p>

        {#if authErr}
          <div class="login-error" role="alert">{authErr}</div>
        {/if}

        <!-- Google OAuth -->
        <button class="btn btn-oauth" onclick={loginWithGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div class="login-divider"><span>or</span></div>

        <!-- Magic link -->
        <label class="login-label" for="email">Email address</label>
        <input
          id="email"
          type="email"
          class="login-input"
          placeholder="you@example.com"
          bind:value={email}
          onkeydown={handleKey}
          autocomplete="email"
        />
        <button
          class="btn btn-primary"
          style="width: 100%; margin-top: 10px;"
          onclick={sendMagicLink}
          disabled={loading || !email.trim()}
        >
          {#if loading}
            Sending…
          {:else}
            Send magic link
          {/if}
        </button>

        <p class="login-terms">
          By signing in you agree to our
          <a href="/terms">Terms</a> and <a href="/privacy">Privacy policy</a>.
        </p>
      {/if}
    </div>
  </div>
</div>

<style>
  .login-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* Brand panel */
  .login-brand {
    background: var(--charcoal-brown);
    color: var(--floral-white);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    position: relative;
    overflow: hidden;
  }
  .login-brand::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 10px;
    background: var(--kente-stripe);
  }
  .login-brand-inner {
    display: flex;
    flex-direction: column;
    gap: 32px;
    max-width: 360px;
    position: relative;
    z-index: 1;
  }
  .login-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: var(--floral-white);
    font-weight: 700;
    font-size: 26px;
    letter-spacing: -0.03em;
  }
  .login-quote {
    font-size: 28px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.025em;
    color: var(--floral-white);
    margin: 0;
    border-left: 3px solid var(--accent);
    padding-left: 20px;
  }
  .login-adinkra {
    color: var(--floral-white);
    display: flex;
    justify-content: flex-start;
  }
  .login-tagline {
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(250,246,238,0.5);
  }

  /* Form side */
  .login-form-side {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px;
    background: var(--bg);
  }
  .login-card {
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }
  .login-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--fg);
    margin-bottom: 6px;
  }
  .login-sub {
    font-size: 15px;
    color: var(--fg-muted);
    margin-bottom: 28px;
  }

  /* Auth error */
  .login-error {
    font-size: 14px;
    color: var(--accent);
    background: var(--accent-tint);
    border: 1px solid rgba(201,70,44,0.25);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    margin-bottom: 4px;
  }

  /* OAuth button */
  .btn-oauth {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 12px 20px;
    background: var(--bg-elevated);
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    font-size: 15px;
    font-weight: 500;
    color: var(--fg);
    cursor: pointer;
    transition: all 140ms var(--ease-out);
    font-family: inherit;
  }
  .btn-oauth:hover { background: var(--bg-sunken); }

  .login-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 22px 0;
    color: var(--fg-subtle);
    font-size: 13px;
  }
  .login-divider::before,
  .login-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .login-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--fg);
    margin-bottom: 6px;
  }
  .login-input {
    width: 100%;
    padding: 11px 14px;
    border: 1.5px solid var(--border-strong);
    border-radius: var(--radius-md);
    font-size: 15px;
    font-family: inherit;
    color: var(--fg);
    background: var(--bg-elevated);
    outline: none;
    transition: border-color 140ms var(--ease-out), box-shadow 140ms;
  }
  .login-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(201,70,44,0.15);
  }

  .login-terms {
    margin-top: 16px;
    font-size: 12px;
    color: var(--fg-subtle);
    text-align: center;
    line-height: 1.5;
  }
  .login-terms a { color: var(--link); }

  /* Sent state */
  .login-sent {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    padding: 24px;
    background: var(--bg-elevated);
    border-radius: var(--radius-xl);
    border: 1.5px solid var(--border);
  }
  .login-sent-icon {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--accent-tint);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .login-sent h2 { font-size: 20px; font-weight: 700; color: var(--fg); }
  .login-sent p  { font-size: 15px; color: var(--fg-muted); line-height: 1.5; }

  @media (max-width: 768px) {
    .login-shell  { grid-template-columns: 1fr; }
    .login-brand  { display: none; }
    .login-form-side { padding: 32px 24px; }
  }
</style>
