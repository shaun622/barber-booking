<script lang="ts">
  import ReassignBarber from '$lib/components/ReassignBarber.svelte';
  import RescheduleTime from '$lib/components/RescheduleTime.svelte';
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

  /* ── Day time-grid ── */
  const HOUR_PX = 78;
  const PPM = HOUR_PX / 60;
  const startMinOf = (iso: string) => +iso.slice(11, 13) * 60 + +iso.slice(14, 16);
  const hourLabel = (m: number) => `${pad(Math.floor(m / 60))}:00`;

  const STATUS_BLOCK: Record<string, { bg: string; fg: string }> = {
    pending: { bg: '#f7e6c4', fg: '#7a5a16' },
    confirmed: { bg: '#d6e8f4', fg: '#1f5b86' },
    completed: { bg: '#d4ecdd', fg: '#1f6e45' },
    no_show: { bg: '#f0dada', fg: '#8a3d3d' }
  };
  const stBlock = (s: string) => STATUS_BLOCK[s] ?? STATUS_BLOCK.pending;

  interface GridCol {
    id: number | null;
    name: string;
    photo: string | null;
  }
  const gridCols = $derived.by(() => {
    const cols: GridCol[] = data.barbers.map((b) => ({ id: b.id, name: b.name, photo: b.photo_url }));
    const hasAny = dayList.some((b) => b.barber_id == null || !data.barbers.some((x) => x.id === b.barber_id));
    if (hasAny) cols.push({ id: null, name: 'Any', photo: null });
    return cols;
  });
  function colBookings(colId: number | null) {
    return dayList.filter((b) =>
      colId == null
        ? b.barber_id == null || !data.barbers.some((x) => x.id === b.barber_id)
        : b.barber_id === colId
    );
  }
  const gridRange = $derived.by(() => {
    let minS = 540;
    let maxE = 1140;
    for (const b of dayList) {
      const s = startMinOf(b.starts_at);
      const e = s + (b.duration_min_total ?? 30);
      if (s < minS) minS = s;
      if (e > maxE) maxE = e;
    }
    return { startMin: Math.floor(minS / 60) * 60, endMin: Math.ceil(maxE / 60) * 60 };
  });
  const gridHours = $derived.by(() => {
    const out: number[] = [];
    for (let m = gridRange.startMin; m <= gridRange.endMin; m += 60) out.push(m);
    return out;
  });
  const gridHeight = $derived((gridRange.endMin - gridRange.startMin) * PPM);

  let nowMin = $state<number | null>(null);
  $effect(() => {
    if (data.anchor !== data.today) {
      nowMin = null;
      return;
    }
    const upd = () => {
      const n = new Date();
      const w = new Date(n.getTime() + (8 * 60 + n.getTimezoneOffset()) * 60_000);
      nowMin = w.getUTCHours() * 60 + w.getUTCMinutes();
    };
    upd();
    const iv = setInterval(upd, 60_000);
    return () => clearInterval(iv);
  });

  let selectedId = $state<number | null>(null);
  const selectedBooking = $derived(dayList.find((b) => b.id === selectedId) ?? null);
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
    <!-- Day view: schedule grid -->
    {#if dayList.length === 0}
      <div class="glass p-10 text-center text-[var(--color-bone-dim)]">No bookings this day.</div>
    {:else}
      <div class="rounded-xl border border-[var(--color-line)] bg-[var(--ivory)] overflow-x-auto">
        <div class="min-w-max">
          <!-- header: barbers -->
          <div class="flex border-b border-[var(--color-line)]">
            <div class="w-12 shrink-0 sticky left-0 z-20 bg-[var(--ivory)]"></div>
            {#each gridCols as col (col.id ?? 'any')}
              {@const sw = swatch(col.id)}
              <div class="w-28 shrink-0 flex flex-col items-center gap-1 py-2.5 border-l border-[var(--color-line)]">
                {#if col.photo}
                  <img src={col.photo} alt={col.name} class="w-8 h-8 rounded-full object-cover" />
                {:else}
                  <span class="w-8 h-8 rounded-full grid place-items-center text-xs font-semibold" style="background:{sw.bg};color:{sw.bd};">{col.name[0]}</span>
                {/if}
                <span class="text-xs font-medium truncate max-w-[6.5rem]">{col.name}</span>
              </div>
            {/each}
          </div>
          <!-- body: time axis + columns -->
          <div class="flex relative">
            <div class="w-12 shrink-0 sticky left-0 z-20 bg-[var(--ivory)] relative" style="height:{gridHeight}px">
              {#each gridHours as m (m)}
                <div class="absolute right-1.5 text-[10px] tnum text-[var(--color-bone-faint)]" style="top:{(m - gridRange.startMin) * PPM - 5}px">{hourLabel(m)}</div>
              {/each}
            </div>
            {#each gridCols as col (col.id ?? 'any')}
              {@const sw = swatch(col.id)}
              <div
                class="w-28 shrink-0 relative border-l border-[var(--color-line)]"
                style="height:{gridHeight}px;background:repeating-linear-gradient(to bottom, transparent, transparent {HOUR_PX - 1}px, var(--color-line) {HOUR_PX - 1}px, var(--color-line) {HOUR_PX}px);">
                {#each colBookings(col.id) as b (b.id)}
                  {@const top = (startMinOf(b.starts_at) - gridRange.startMin) * PPM}
                  {@const h = Math.max((b.duration_min_total ?? 30) * PPM - 2, 20)}
                  {@const st = stBlock(b.status)}
                  <button
                    type="button"
                    onclick={() => (selectedId = b.id)}
                    class="absolute left-1 right-1 rounded-md px-1.5 py-1 text-left overflow-hidden border-l-[3px] {selectedId === b.id ? 'ring-2 ring-[var(--gold-500)] z-10' : ''}"
                    style="top:{top}px;height:{h}px;background:{st.bg};border-color:{sw.bd};color:{st.fg};">
                    <div class="text-[10px] font-semibold tnum leading-none">{time(b.starts_at)}</div>
                    <div class="text-[11px] leading-tight truncate font-medium" style="color:#2a241c;">{b.customer_name}</div>
                  </button>
                {/each}
              </div>
            {/each}
            {#if nowMin !== null && nowMin >= gridRange.startMin && nowMin <= gridRange.endMin}
              <div class="absolute left-12 right-0 pointer-events-none z-10" style="top:{(nowMin - gridRange.startMin) * PPM}px">
                <div class="h-px bg-red-500"></div>
                <div class="absolute left-0 -top-1 w-2 h-2 rounded-full bg-red-500"></div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      {#if selectedBooking}
        {@const b = selectedBooking}
        {@const sw = swatch(b.barber_id)}
        <div class="glass p-4 mt-4 border-l-[4px]" style="border-color:{sw.bd}">
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
            <ReassignBarber id={b.id} barberId={b.barber_id} barbers={data.barbers} />
            <RescheduleTime id={b.id} startsAt={b.starts_at} />
            <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="confirmed" /><button class="pill">Confirm</button></form>
            <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="completed" /><button class="pill">Completed</button></form>
            <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="no_show" /><button class="pill">No-show</button></form>
            <form method="POST" action="?/setStatus"><input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="cancelled" /><button class="pill !text-red-600">Cancel</button></form>
          </div>
        </div>
      {:else}
        <p class="text-center text-xs text-[var(--color-bone-dim)] mt-3">Tap a booking to confirm, reschedule, reassign or message.</p>
      {/if}
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
