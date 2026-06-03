<script lang="ts">
  import '../app.css';
  import type { LayoutData } from './$types';
  let { data, children }: { data: LayoutData; children: any } = $props();

  async function setLang(next: 'en' | 'id') {
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    location.reload();
  }
</script>

<div class="min-h-screen flex flex-col">
  <header class="border-b border-neutral-200 bg-white">
    <div class="mx-auto max-w-3xl flex items-center justify-between px-4 py-3">
      <a href="/" class="font-semibold tracking-tight">Balis Barber</a>
      <div class="flex items-center gap-2 text-sm">
        <button
          class:font-semibold={data.lang === 'en'}
          class="px-2 py-1 hover:underline"
          onclick={() => setLang('en')}>EN</button>
        <span class="text-neutral-300">|</span>
        <button
          class:font-semibold={data.lang === 'id'}
          class="px-2 py-1 hover:underline"
          onclick={() => setLang('id')}>ID</button>
      </div>
    </div>
  </header>

  <main class="flex-1 mx-auto w-full max-w-3xl px-4 py-6">
    {@render children()}
  </main>

  <footer class="border-t border-neutral-200 bg-white">
    <div class="mx-auto max-w-3xl px-4 py-4 text-xs text-neutral-500 flex justify-between">
      <span>© Balis Barber · Sanur, Bali</span>
      <a class="hover:underline" href="https://wa.me/6281337995251">+62 813 3799 5251</a>
    </div>
  </footer>
</div>
