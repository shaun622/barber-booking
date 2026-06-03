<script lang="ts">
  import { goto } from '$app/navigation';
  import { dict, serviceName } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();
  const t = $derived(dict(data.lang));

  // svelte-ignore state_referenced_locally
  let selected = $state<Set<number>>(new Set(data.selectedAddonIds));

  const totalMin = $derived(
    data.base.duration_min + data.addons.filter((a) => selected.has(a.id)).reduce((s, a) => s + a.duration_min, 0)
  );
  const totalIdr = $derived(
    data.base.price_idr + data.addons.filter((a) => selected.has(a.id)).reduce((s, a) => s + a.price_idr, 0)
  );

  function toggle(id: number) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    selected = next;
  }

  async function go(includeAddons: boolean) {
    await fetch('/api/flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonIds: includeAddons ? [...selected] : [] })
    });
    goto('/barber');
  }

  function fmt(n: number) {
    return 'IDR ' + n.toLocaleString('id-ID');
  }
</script>

<nav class="text-sm text-neutral-500 mb-3">
  <a href="/" class="hover:underline">{t.steps.category}</a>
  <span class="mx-1">›</span>
  <a href="/service?cat={data.base.category}" class="hover:underline">{t.steps.service}</a>
  <span class="mx-1">›</span>
  <span class="text-neutral-900 font-medium">{t.steps.addons}</span>
</nav>

<h1 class="text-2xl font-semibold tracking-tight mb-1">{t.steps.addons}</h1>
<div class="text-sm text-neutral-500 mb-4">
  {serviceName(data.base, data.lang)} · {data.base.duration_min} {t.common.min} · {fmt(data.base.price_idr)}
</div>

<div class="grid gap-2">
  {#each data.addons as a (a.id)}
    <button
      type="button"
      onclick={() => toggle(a.id)}
      class="text-left rounded-xl border bg-white p-4 transition
             {selected.has(a.id)
               ? 'border-neutral-900 ring-2 ring-neutral-900/10'
               : 'border-neutral-200 hover:border-neutral-400'}">
      <div class="flex items-baseline justify-between gap-3">
        <div class="font-medium">{serviceName(a, data.lang)}</div>
        <div class="text-sm text-neutral-500 whitespace-nowrap">
          +{a.duration_min} {t.common.min}
        </div>
      </div>
      <div class="font-semibold mt-1">
        {a.price_from_only ? `${t.common.from} ${fmt(a.price_idr)}` : fmt(a.price_idr)}
      </div>
    </button>
  {/each}
</div>

<div class="sticky bottom-0 mt-6 -mx-4 border-t border-neutral-200 bg-white px-4 py-3
            flex items-center justify-between gap-3">
  <div>
    <div class="text-xs text-neutral-500 uppercase tracking-wide">{t.service.running_total}</div>
    <div class="font-semibold">{fmt(totalIdr)} · {totalMin} {t.common.min}</div>
  </div>
  <div class="flex gap-2">
    <button
      onclick={() => go(false)}
      class="px-4 py-2 rounded-lg border border-neutral-300 text-sm">{t.common.skip}</button>
    <button
      onclick={() => go(true)}
      class="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm">{t.common.continue}</button>
  </div>
</div>
