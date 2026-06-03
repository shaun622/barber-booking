<script lang="ts">
  import { goto } from '$app/navigation';
  import { dict, serviceName, serviceDesc } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();
  const t = $derived(dict(data.lang));

  async function pick(id: number) {
    await fetch('/api/flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseServiceId: id, addonIds: [] })
    });
    // Skip add-ons step for on-call (and admins can change service later if needed).
    if (data.category === 'oncall') {
      goto('/barber');
    } else {
      goto('/addons');
    }
  }

  function fmt(n: number) {
    return 'IDR ' + n.toLocaleString('id-ID');
  }
</script>

<nav class="text-sm text-neutral-500 mb-3">
  <a href="/" class="hover:underline">{t.steps.category}</a>
  <span class="mx-1">›</span>
  <span class="text-neutral-900 font-medium">{t.steps.service}</span>
</nav>

<h1 class="text-2xl font-semibold tracking-tight mb-4">{t.steps.service}</h1>

<div class="grid gap-3">
  {#each data.services as s (s.id)}
    <button
      type="button"
      onclick={() => pick(s.id)}
      class="text-left rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-900 transition">
      <div class="flex items-baseline justify-between gap-3">
        <div class="font-medium">{serviceName(s, data.lang)}</div>
        <div class="text-sm text-neutral-500 whitespace-nowrap">
          {s.duration_min} {t.common.min}
        </div>
      </div>
      {#if serviceDesc(s, data.lang)}
        <div class="text-sm text-neutral-500 mt-1">{serviceDesc(s, data.lang)}</div>
      {/if}
      <div class="mt-2 flex items-center gap-2">
        <div class="font-semibold">
          {s.price_from_only ? `${t.common.from} ${fmt(s.price_idr)}` : fmt(s.price_idr)}
        </div>
        {#if s.male_only}
          <span class="text-xs rounded-full bg-neutral-100 px-2 py-0.5 text-neutral-600">
            {t.common.male_only}
          </span>
        {/if}
      </div>
    </button>
  {/each}
</div>
