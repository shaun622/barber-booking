<script lang="ts">
  import { goto } from '$app/navigation';
  import { dict, serviceName } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();
  const t = $derived(dict(data.lang));

  async function pick(barberId: number | null) {
    await fetch('/api/flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberId })
    });
    goto('/time');
  }
</script>

<nav class="text-sm text-neutral-500 mb-3">
  <a href="/service?cat={data.base.category}" class="hover:underline">{t.steps.service}</a>
  <span class="mx-1">›</span>
  <span class="text-neutral-900 font-medium">{t.steps.barber}</span>
</nav>

<h1 class="text-2xl font-semibold tracking-tight mb-1">{t.steps.barber}</h1>
<div class="text-sm text-neutral-500 mb-4">{serviceName(data.base, data.lang)}</div>

<div class="grid gap-2">
  <button
    type="button"
    onclick={() => pick(null)}
    class="text-left rounded-xl border bg-white p-4 hover:border-neutral-900 transition">
    <div class="font-medium">{t.common.any_barber}</div>
  </button>
  {#each data.barbers as b (b.id)}
    <button
      type="button"
      onclick={() => pick(b.id)}
      class="text-left rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-900 transition flex items-center gap-3">
      {#if b.photo_url}
        <img src={b.photo_url} alt="" class="w-10 h-10 rounded-full object-cover" />
      {:else}
        <div class="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm text-neutral-500">
          {b.name[0]}
        </div>
      {/if}
      <div class="font-medium">{b.name}</div>
    </button>
  {/each}
</div>
