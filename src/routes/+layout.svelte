<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import type { LayoutData } from './$types';
  let { data, children }: { data: LayoutData; children: any } = $props();

  const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

  function setLang(next: 'en' | 'id') {
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    location.reload();
  }
</script>

<div class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[rgba(244,239,229,0.8)] backdrop-blur-xl">
    <div class="mx-auto max-w-6xl flex items-center justify-between px-5 sm:px-6 h-16">
      <a href="/" aria-label="Balis Barber — Sanur" class="flex items-center">
        <span class="brand-logo h-10 w-10 sm:h-11 sm:w-11"></span>
      </a>

      {#if !isAdmin}
        <div class="flex items-center gap-1 rounded-full border border-[var(--color-line)] bg-[rgba(245,241,232,0.03)] p-1 text-sm">
          <button
            class="px-3 py-1 rounded-full transition {data.lang === 'en'
              ? 'bg-[rgba(201,169,97,0.16)] text-[var(--color-bone)]'
              : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'}"
            onclick={() => setLang('en')}>EN</button>
          <button
            class="px-3 py-1 rounded-full transition {data.lang === 'id'
              ? 'bg-[rgba(201,169,97,0.16)] text-[var(--color-bone)]'
              : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'}"
            onclick={() => setLang('id')}>ID</button>
        </div>
      {:else}
        <a href="/admin" class="eyebrow text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]">Admin</a>
      {/if}
    </div>
  </header>

  <main class="flex-1 w-full">
    {@render children()}
  </main>

  <footer class="border-t border-[var(--color-line)] mt-12">
    <div class="mx-auto max-w-6xl px-5 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--color-bone-faint)]">
      <span>© Balis Barber · Jl. Bypass Ngurah Rai, Sanur</span>
      <a class="hover:text-[var(--color-bone-dim)] transition tnum" href="https://wa.me/6281337995251"
        >+62 813 3799 5251</a>
    </div>
  </footer>
</div>
