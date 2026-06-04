<script lang="ts">
  import { goto } from '$app/navigation';
  import { booking, ui, commitFlow } from '$lib/booking.svelte';
  import type { Barber } from '$lib/db';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();

  const t = $derived(
    data.lang === 'id'
      ? { title: 'Pilih barber', any: 'Tanpa preferensi', anyDesc: 'Ketersediaan maksimal', role: 'Senior Barber', continue: 'Lanjut' }
      : { title: 'Select a barber', any: 'No preference', anyDesc: 'Maximum availability', role: 'Senior Barber', continue: 'Continue' }
  );

  function pickAny() {
    booking.barberId = null;
    booking.barberName = null;
    commitFlow({ barberId: null });
  }
  function pick(b: Barber) {
    booking.barberId = b.id;
    booking.barberName = b.name;
    commitFlow({ barberId: b.id });
  }

  $effect(() => {
    ui.action = {
      label: t.continue,
      disabled: booking.barberId === undefined,
      run: () => goto('/time')
    };
    return () => {
      ui.action = null;
    };
  });
</script>

<h1 class="display text-3xl sm:text-4xl rise rise-1 mb-6">{t.title}</h1>

<div class="grid gap-3">
  <!-- Any -->
  <button
    type="button"
    onclick={pickAny}
    class="glass card-i text-left p-4 flex items-center gap-4 rise rise-1 {booking.barberId === null ? 'is-selected' : ''}">
    <div class="shrink-0 w-12 h-12 rounded-full grid place-items-center border border-[var(--color-line-strong)] text-[var(--color-brass)]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" /></svg>
    </div>
    <div class="flex-1 min-w-0">
      <div class="font-medium">{t.any}</div>
      <div class="text-sm text-[var(--color-bone-faint)]">{t.anyDesc}</div>
    </div>
  </button>

  {#each data.barbers as b, i (b.id)}
    {@const selected = booking.barberId === b.id}
    <button
      type="button"
      onclick={() => pick(b)}
      class="glass card-i text-left p-4 flex items-center gap-4 rise rise-{Math.min(i + 2, 5)} {selected ? 'is-selected' : ''}">
      {#if b.photo_url}
        <img src={b.photo_url} alt={b.name} class="shrink-0 w-12 h-12 rounded-full object-cover" />
      {:else}
        <div class="shrink-0 w-12 h-12 rounded-full grid place-items-center bg-[rgba(201,169,97,0.08)] ring-1 ring-[rgba(201,169,97,0.4)]">
          <span class="display text-lg brass-text">{b.name[0]}</span>
        </div>
      {/if}
      <div class="flex-1 min-w-0">
        <div class="font-medium">{b.name}</div>
        <div class="text-sm text-[var(--color-bone-faint)]">{t.role}</div>
      </div>
      {#if selected}
        <span class="shrink-0 w-7 h-7 rounded-full grid place-items-center bg-gradient-to-br from-[var(--color-brass-light)] to-[var(--color-brass)] text-[#1a1408]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
      {/if}
    </button>
  {/each}
</div>
