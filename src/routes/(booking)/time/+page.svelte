<script lang="ts">
  import { goto } from '$app/navigation';
  import { booking, ui, commitFlow } from '$lib/booking.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();

  const t = $derived(
    data.lang === 'id'
      ? { title: 'Pilih waktu', none: 'Tidak ada slot tersedia untuk tanggal ini.', loading: 'Memuat…', more: 'Tanggal lain', continue: 'Lanjut' }
      : { title: 'Select date & time', none: 'No times available on this date.', loading: 'Loading…', more: 'More dates', continue: 'Continue' }
  );

  // svelte-ignore state_referenced_locally
  const monthsArr = data.lang === 'id'
    ? ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  // svelte-ignore state_referenced_locally
  const daysArr = data.lang === 'id'
    ? ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
    : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function todayWita(): string {
    const now = new Date();
    const w = new Date(now.getTime() + (8 * 60 + now.getTimezoneOffset()) * 60_000);
    return w.toISOString().slice(0, 10);
  }

  function buildStrip(fromDate: string, n: number) {
    const out: { date: string; dow: number; day: number; mon: string }[] = [];
    const [y, m, d] = fromDate.split('-').map(Number);
    for (let i = 0; i < n; i++) {
      const dt = new Date(Date.UTC(y, m - 1, d + i));
      out.push({
        date: dt.toISOString().slice(0, 10),
        dow: dt.getUTCDay(),
        day: dt.getUTCDate(),
        mon: monthsArr[dt.getUTCMonth()]
      });
    }
    return out;
  }

  const today = todayWita();
  const initialDate = booking.startsAt && booking.startsAt.slice(0, 10) >= today ? booking.startsAt.slice(0, 10) : today;

  let stripStart = $state(today);
  let selectedDate = $state(initialDate);
  let loading = $state(false);
  let slots = $state<{ starts_at: string; label: string }[]>([]);

  const strip = $derived(buildStrip(stripStart, 14));

  async function loadSlots(date: string) {
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

  function selectDate(date: string) {
    selectedDate = date;
    loadSlots(date);
  }

  function pickSlot(startsAt: string) {
    booking.startsAt = startsAt;
    commitFlow({ startsAt });
  }

  function onNativeDate(e: Event) {
    const v = (e.target as HTMLInputElement).value;
    if (!v) return;
    if (v < today) return;
    stripStart = v;
    selectDate(v);
  }

  // initial load
  $effect(() => {
    loadSlots(initialDate);
  });

  $effect(() => {
    ui.action = {
      label: t.continue,
      disabled: !booking.startsAt,
      run: () => goto('/details')
    };
    return () => {
      ui.action = null;
    };
  });
</script>

<div class="flex items-center justify-between gap-3 mb-6 rise rise-1">
  <h1 class="display text-3xl sm:text-4xl">{t.title}</h1>
  <label class="btn-icon shrink-0 cursor-pointer relative" title={t.more}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
    <input type="date" min={today} onchange={onNativeDate} class="absolute inset-0 opacity-0 cursor-pointer" />
  </label>
</div>

<!-- Day strip -->
<div class="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 rise rise-2">
  {#each strip as d (d.date)}
    {@const sel = selectedDate === d.date}
    <button
      type="button"
      onclick={() => selectDate(d.date)}
      class="shrink-0 w-16 py-3 rounded-2xl border text-center transition-all duration-200 {sel
        ? 'bg-gradient-to-br from-[var(--color-brass-light)] to-[var(--color-brass)] border-transparent text-[#1a1408]'
        : 'glass card-i'}">
      <div class="text-[0.7rem] uppercase tracking-wide {sel ? 'text-[#3a2e12]' : 'text-[var(--color-bone-faint)]'}">{daysArr[d.dow]}</div>
      <div class="display text-xl tnum leading-tight">{d.day}</div>
      <div class="text-[0.65rem] {sel ? 'text-[#3a2e12]' : 'text-[var(--color-bone-faint)]'}">{d.mon}</div>
    </button>
  {/each}
</div>

<!-- Slots -->
<div class="mt-7">
  {#if loading}
    <p class="text-sm text-[var(--color-bone-dim)] py-8 text-center">{t.loading}</p>
  {:else if slots.length === 0}
    <div class="glass p-8 text-center text-sm text-[var(--color-bone-dim)]">{t.none}</div>
  {:else}
    <div class="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {#each slots as s (s.starts_at)}
        {@const sel = booking.startsAt === s.starts_at}
        <button
          type="button"
          onclick={() => pickSlot(s.starts_at)}
          class="py-2.5 rounded-xl border text-center tnum text-sm transition-all duration-200 {sel
            ? 'bg-gradient-to-br from-[var(--color-brass-light)] to-[var(--color-brass)] border-transparent text-[#1a1408] font-medium'
            : 'glass card-i'}">
          {s.label}
        </button>
      {/each}
    </div>
  {/if}
</div>
