<script lang="ts">
  import { goto } from '$app/navigation';
  import { serviceName } from '$lib/i18n';
  import { booking, ui, commitFlow, idr } from '$lib/booking.svelte';
  import type { Service } from '$lib/db';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();

  const t = $derived(
    data.lang === 'id'
      ? { title: 'Tambahkan ekstra', opt: 'Opsional — sentuh untuk menambah', min: 'menit', from: 'mulai', continue: 'Lanjut', skip: 'Lewati' }
      : { title: 'Add extras', opt: 'Optional — tap to add', min: 'min', from: 'from', continue: 'Continue', skip: 'Skip' }
  );

  function toggle(a: Service) {
    const has = booking.addons.some((x) => x.id === a.id);
    booking.addons = has ? booking.addons.filter((x) => x.id !== a.id) : [...booking.addons, a];
    commitFlow({ addonIds: booking.addons.map((x) => x.id) });
  }

  $effect(() => {
    const any = booking.addons.length > 0;
    ui.action = {
      label: any ? t.continue : t.skip,
      disabled: false,
      run: () => goto('/barber')
    };
    return () => {
      ui.action = null;
    };
  });
</script>

<h1 class="display text-3xl sm:text-4xl rise rise-1">{t.title}</h1>
<p class="text-sm text-[var(--color-bone-dim)] mt-2 mb-6 rise rise-2">{t.opt}</p>

<div class="grid gap-3 sm:grid-cols-2">
  {#each data.addons as a, i (a.id)}
    {@const selected = booking.addons.some((x) => x.id === a.id)}
    <button
      type="button"
      onclick={() => toggle(a)}
      class="glass card-i text-left p-4 rise rise-{Math.min(i + 2, 5)} {selected ? 'is-selected' : ''}">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-medium">{serviceName(a, data.lang)}</h3>
          <div class="text-sm text-[var(--color-bone-faint)] mt-0.5 tnum">+{a.duration_min} {t.min}</div>
          <div class="mt-2 text-sm font-medium tnum">
            {#if a.price_from_only}<span class="text-[var(--color-bone-dim)]">{t.from}</span> {/if}{idr(a.price_idr)}
          </div>
        </div>
        <span
          class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 {selected
            ? 'bg-gradient-to-br from-[var(--color-brass-light)] to-[var(--color-brass)] border-transparent text-[#1a1408]'
            : 'border-[var(--color-line-strong)] text-[var(--color-bone-dim)]'}">
          {#if selected}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          {:else}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {/if}
        </span>
      </div>
    </button>
  {/each}
</div>
