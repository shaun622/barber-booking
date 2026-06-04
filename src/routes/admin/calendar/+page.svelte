<script lang="ts">
  import type { PageData } from './$types';
  import { BARBER_PALETTE, ANY_SWATCH, STATUS_INFO } from '$lib/barberColor';
  let { data }: { data: PageData } = $props();

  const pad = (n: number) => String(n).padStart(2, '0');
  const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function swatch(barberId: number | null) {
    if (barberId == null) return ANY_SWATCH;
    const idx = data.barbers.findIndex((b) => b.id === barberId);
    return idx === -1 ? ANY_SWATCH : BARBER_PALETTE[idx % BARBER_PALETTE.length];
  }
  function si(s: string) {
    return STATUS_INFO[s] ?? STATUS_INFO.pending;
  }
  const time = (iso: string) => iso.slice(11, 16);
  const dnum = (s: string) => Number(s.slice(8, 10));
  const ddow = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  };
  const vlink = (view: string, d: string) => `?view=${view}&d=${d}`;

  const cells = $derived([
    ...Array.from({ length: data.firstWeekday }, () => null),
    ...Array.from({ length: data.daysInMonth }, (_, i) => i + 1)
  ]);
  const mkey = (day: number) => `${data.year}-${pad(data.month)}-${pad(day)}`;
  const dayList = $derived(data.byDay[data.anchor] ?? []);

  function waLink(b: { whatsapp_phone: string; customer_name: string; starts_at: string }) {
    const phone = String(b.whatsapp_phone).replace(/[^0-9]/g, '');
    const when = `${b.starts_at.slice(8, 10)}/${b.starts_at.slice(5, 7)} ${time(b.starts_at)}`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${b.customer_name}, confirming your Balis Barber booking on ${when}. See you then!`)}`;
  }
</script>

<div class="mx-auto max-w-5xl px-5 sm:px-6 py-8">
  <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
    <div>
      <h1 class="display text-3xl">{data.title}</h1>
      <p class="text-sm text-[var(--color-bone-dim)] mt-1">{data.total} booking{data.total === 1 ? '' : 's'}</p>
    </div>
    <div class="flex items-center gap-2">
      <div class="flex rounded-full border border-[var(--color-line)] p-1 text-sm">
        {#each [['day', 'Today'], ['week', 'Week'], ['month', 'Month']] as [v, label] (v)}
          <a
            href={vlink(v, v === 'day' ? data.today : data.anchor)}
            class="px-3 py-1 rounded-full transition {data.view === v
              ? 'bg-[var(--gold-500)] text-[var(--ink-heading)] font-medium'
              : 'text-[var(--color-bone-dim)] hover:text-[var(--color-bone)]'}">{label}</a>
        {/each}
      </div>
      <a href={vlink(data.view, data.prev)} class="btn-icon" aria-label="Previous">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </a>
      <a href={vlink(data.view, data.next)} class="btn-icon" aria-label="Next">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </a>
    </div>
  </div>

  {#if data.view === 'month'}
    <div class="grid grid-cols-7 gap-1 mb-1">
      {#each weekdayShort as w (w)}
        <div class="text-center text-[11px] uppercase tracking-wide text-[var(--color-bone-faint)] py-1">{w}</div>
      {/each}
    </div>
    <div class="grid grid-cols-7 gap-1">
      {#each cells as cell, i (i)}
        {#if cell === null}
          <div class="min-h-[5.5rem]"></div>
        {:else}
          {@const k = mkey(cell)}
          {@const list = data.byDay[k] ?? []}
          {@const isToday = k === data.today}
          <a href={vlink('day', k)} class="block min-h-[5.5rem] rounded-lg border p-1.5 transition hover:border-[var(--gold-border-strong)] {isToday ? 'border-[var(--gold-500)] bg-[var(--gold-tint)]' : 'border-[var(--color-line)] bg-[var(--ivory)]'}">
            <div class="text-xs font-medium mb-1 {isToday ? 'text-[var(--gold-700)]' : 'text-[var(--color-bone-dim)]'}">{cell}</div>
            <div class="space-y-1">
              {#each list.slice(0, 3) as b (b.id)}
                {@const sw = swatch(b.barber_id)}
                <div class="rounded px-1.5 py-0.5 text-[11px] leading-tight truncate border-l-2 flex items-center gap-1" style="background:{sw.bg};border-color:{sw.bd}" title="{time(b.starts_at)} {b.customer_name} · {b.service_name} · {b.barber_name ?? 'Any'} · {si(b.status).label}">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:{si(b.status).dot}"></span>
                  <span class="tnum font-medium">{time(b.starts_at)}</span>
                  <span class="truncate">{b.customer_name}</span>
                </div>
              {/each}
              {#if list.length > 3}<div class="text-[11px] text-[var(--color-bone-faint)] px-1">+{list.length - 3} more</div>{/if}
            </div>
          </a>
        {/if}
      {/each}
    </div>
  {:else if data.view === 'week'}
    <div class="flex gap-2 overflow-x-auto pb-2">
      {#each data.weekDates as wd (wd)}
        {@const list = data.byDay[wd] ?? []}
        {@const isToday = wd === data.today}
        <div class="min-w-[8.5rem] flex-1">
          <a href={vlink('day', wd)} class="block text-center pb-2 rounded-lg {isToday ? 'bg-[var(--gold-tint)]' : ''}">
            <div class="text-[11px] uppercase tracking-wide text-[var(--color-bone-faint)]">{weekdayShort[ddow(wd)]}</div>
            <div class="display text-lg {isToday ? 'brass-text' : ''}">{dnum(wd)}</div>
          </a>
          <div class="space-y-1.5">
            {#each list as b (b.id)}
              {@const sw = swatch(b.barber_id)}
              <div class="rounded-lg border-l-[3px] p-2 text-xs" style="background:{sw.bg};border-color:{sw.bd}">
                <div class="flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:{si(b.status).dot}"></span>
                  <span class="tnum font-medium">{time(b.starts_at)}</span>
                </div>
                <div class="font-medium truncate mt-0.5">{b.customer_name}</div>
                <div class="text-[var(--color-bone-dim)] truncate">{b.barber_name ?? 'Any'}</div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Day view: actionable agenda -->
    {#if dayList.length === 0}
      <div class="glass p-10 text-center text-[var(--color-bone-dim)]">No bookings this day.</div>
    {:else}
      <div class="grid gap-3">
        {#each dayList as b (b.id)}
          {@const sw = swatch(b.barber_id)}
          <div class="glass p-4 border-l-[4px]" style="border-color:{sw.bd}">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div class="font-medium"><span class="tnum">{time(b.starts_at)}</span> · {b.customer_name}</div>
                <div class="text-sm text-[var(--color-bone-dim)] tnum">{b.whatsapp_phone}</div>
                <div class="text-sm text-[var(--color-bone-dim)]">{b.service_name} · {b.barber_name ?? 'Any'}</div>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full" style="background:{si(b.status).dot}22;color:{si(b.status).dot}">{si(b.status).label}</span>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <a href={waLink(b)} target="_blank" rel="noopener" class="btn btn-brass !py-1.5 !px-3 !text-sm">WhatsApp</a>
              <form method="POST" action="?/setBarber" class="flex items-center gap-1">
                <input type="hidden" name="id" value={b.id} />
                <select name="barber_id" class="field !py-1.5 !w-auto !text-sm">
                  <option value="" selected={b.barber_id == null}>Any</option>
                  {#each data.barbers as bb (bb.id)}<option value={bb.id} selected={b.barber_id === bb.id}>{bb.name}</option>{/each}
                </select>
                <button class="pill">Reassign</button>
              </form>
              <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="confirmed" /><button class="pill">Confirm</button></form>
              <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="completed" /><button class="pill">Completed</button></form>
              <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="no_show" /><button class="pill">No-show</button></form>
              <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="cancelled" /><button class="pill !text-red-600">Cancel</button></form>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}

  <!-- Legends -->
  <div class="mt-7 grid sm:grid-cols-2 gap-4">
    <div>
      <div class="eyebrow mb-2">Barbers</div>
      <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {#each data.barbers as bb, i (bb.id)}
          <span class="inline-flex items-center gap-1.5">
            <span class="w-3.5 h-3.5 rounded-sm border-l-[3px]" style="background:{BARBER_PALETTE[i % BARBER_PALETTE.length].bg};border-color:{BARBER_PALETTE[i % BARBER_PALETTE.length].bd}"></span>
            {bb.name}
          </span>
        {/each}
        <span class="inline-flex items-center gap-1.5">
          <span class="w-3.5 h-3.5 rounded-sm border-l-[3px]" style="background:{ANY_SWATCH.bg};border-color:{ANY_SWATCH.bd}"></span>
          Any
        </span>
      </div>
    </div>
    <div>
      <div class="eyebrow mb-2">Status</div>
      <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
        {#each Object.values(STATUS_INFO) as s (s.label)}
          <span class="inline-flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full" style="background:{s.dot}"></span> {s.label}</span>
        {/each}
      </div>
    </div>
  </div>
</div>
