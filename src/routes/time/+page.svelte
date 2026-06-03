<script lang="ts">
  import { goto } from '$app/navigation';
  import { dict, serviceName } from '$lib/i18n';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();
  const t = $derived(dict(data.lang));

  function todayInWita(): string {
    // Render today's date as YYYY-MM-DD in Asia/Makassar.
    const now = new Date();
    const wita = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000);
    return wita.toISOString().slice(0, 10);
  }

  let date = $state<string>(todayInWita());
  let loading = $state(false);
  let slots = $state<{ starts_at: string; label: string; available_barber_ids: number[] }[]>([]);

  async function loadSlots() {
    loading = true;
    try {
      const r = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date })
      });
      const j: any = await r.json();
      slots = j.slots ?? [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (date) loadSlots();
  });

  async function pick(startsAt: string) {
    await fetch('/api/flow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt })
    });
    goto('/details');
  }
</script>

<nav class="text-sm text-neutral-500 mb-3">
  <a href="/barber" class="hover:underline">{t.steps.barber}</a>
  <span class="mx-1">›</span>
  <span class="text-neutral-900 font-medium">{t.steps.time}</span>
</nav>

<h1 class="text-2xl font-semibold tracking-tight mb-1">{t.steps.time}</h1>
<div class="text-sm text-neutral-500 mb-4">{serviceName(data.base, data.lang)}</div>

<label class="block mb-4">
  <span class="block text-sm font-medium mb-1">{t.time.pick_date}</span>
  <input
    type="date"
    bind:value={date}
    class="block w-full rounded-lg border border-neutral-300 px-3 py-2" />
</label>

{#if loading}
  <div class="text-sm text-neutral-500">{t.common.loading}</div>
{:else if slots.length === 0}
  <div class="text-sm text-neutral-500">{t.time.no_slots}</div>
{:else}
  <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
    {#each slots as s (s.starts_at)}
      <button
        type="button"
        onclick={() => pick(s.starts_at)}
        class="rounded-lg border border-neutral-300 bg-white py-2 hover:border-neutral-900 transition">
        {s.label}
      </button>
    {/each}
  </div>
{/if}
