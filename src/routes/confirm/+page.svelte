<script lang="ts">
  import { page } from '$app/state';
  import { dict } from '$lib/i18n';
  import type { PageData } from './$types';
  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();
  const t = $derived(dict(data.lang));
  const ref = $derived(page.url.searchParams.get('ref') ?? '');
</script>

<div class="text-center py-12">
  <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-600">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  </div>
  <h1 class="text-2xl font-semibold tracking-tight">{t.confirm.title}</h1>
  <p class="text-neutral-600 mt-2">{t.confirm.body}</p>
  {#if ref}
    <p class="text-sm text-neutral-500 mt-4">{t.confirm.ref}: #{ref}</p>
  {/if}
  <a href="/" class="mt-8 inline-block text-sm underline">{t.confirm.home}</a>
</div>
