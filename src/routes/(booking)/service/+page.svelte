<script lang="ts">
  import { goto } from '$app/navigation';
  import { serviceName, serviceDesc } from '$lib/i18n';
  import { booking, ui, commitFlow, idr } from '$lib/booking.svelte';
  import type { Service } from '$lib/db';
  import type { PageData } from './$types';

  let { data }: { data: PageData & { lang: 'en' | 'id' } } = $props();

  type BookableCat = 'package' | 'onsite' | 'oncall';
  // svelte-ignore state_referenced_locally
  let activeCat = $state<BookableCat>(data.initialCat as BookableCat);

  const t = $derived(
    data.lang === 'id'
      ? {
          title: 'Pilih layanan',
          tabs: { package: 'Paket', onsite: 'Di Tempat', oncall: 'Panggilan' },
          intro: {
            package: 'Tarif hemat untuk tampilan terbaik Anda.',
            onsite: 'Potong, cukur, dan styling di barbershop kami.',
            oncall: 'Barber profesional datang ke lokasi Anda.'
          },
          min: 'menit',
          from: 'mulai',
          male: 'Khusus pria',
          continue: 'Lanjut'
        }
      : {
          title: 'Select a service',
          tabs: { package: 'Packages', onsite: 'On-Site', oncall: 'On-Call' },
          intro: {
            package: 'Discounted rates to keep you looking your best.',
            onsite: 'Cuts, shaves and styling at our Sanur shop.',
            oncall: 'A professional barber comes to your location.'
          },
          min: 'min',
          from: 'from',
          male: 'Male only',
          continue: 'Continue'
        }
  );

  const cats: BookableCat[] = ['package', 'onsite', 'oncall'];
  const list = $derived(data.groups[activeCat] as Service[]);

  function select(s: Service) {
    const changed = booking.base?.id !== s.id;
    booking.base = s;
    if (changed) booking.addons = [];
    commitFlow({ baseServiceId: s.id, addonIds: booking.addons.map((a) => a.id) });
  }

  $effect(() => {
    ui.action = {
      label: t.continue,
      disabled: !booking.base,
      run: () => goto(booking.base?.category === 'oncall' ? '/barber' : '/addons')
    };
    return () => {
      ui.action = null;
    };
  });
</script>

<h1 class="display text-3xl sm:text-4xl rise rise-1">{t.title}</h1>

<div class="flex gap-2 mt-6 mb-6 rise rise-2">
  {#each cats as c (c)}
    <button class="pill {activeCat === c ? 'pill-active' : ''}" onclick={() => (activeCat = c)}>
      {t.tabs[c]}
    </button>
  {/each}
</div>

<p class="text-sm text-[var(--color-bone-dim)] mb-5 rise rise-2">{t.intro[activeCat]}</p>

<div class="grid gap-3">
  {#each list as s, i (s.id)}
    {@const selected = booking.base?.id === s.id}
    <button
      type="button"
      onclick={() => select(s)}
      class="glass card-i text-left p-5 rise rise-{Math.min(i + 2, 5)} {selected ? 'is-selected' : ''}">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="text-lg font-medium">{serviceName(s, data.lang)}</h3>
            {#if s.male_only}
              <span class="text-[0.65rem] uppercase tracking-wider rounded-full border border-[var(--color-line-strong)] px-2 py-0.5 text-[var(--color-bone-dim)]">{t.male}</span>
            {/if}
          </div>
          <div class="text-sm text-[var(--color-bone-faint)] mt-0.5 tnum">{s.duration_min} {t.min}</div>
          {#if serviceDesc(s, data.lang)}
            <p class="text-sm text-[var(--color-bone-dim)] mt-2 leading-relaxed max-w-md">
              {serviceDesc(s, data.lang)}
            </p>
          {/if}
          <div class="mt-3 text-base font-medium tnum">
            {#if s.price_from_only}<span class="text-sm text-[var(--color-bone-dim)]">{t.from}&nbsp;</span>{/if}{idr(s.price_idr)}
          </div>
        </div>

        <span
          class="shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 {selected
            ? 'bg-gradient-to-br from-[var(--color-brass-light)] to-[var(--color-brass)] border-transparent text-[#1a1408]'
            : 'border-[var(--color-line-strong)] text-[var(--color-bone-dim)]'}">
          {#if selected}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
          {/if}
        </span>
      </div>
    </button>
  {/each}
</div>
