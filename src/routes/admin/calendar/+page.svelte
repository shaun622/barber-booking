<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  const pad = (n: number) => n.toString().padStart(2, '0');
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build grid: leading blanks + day numbers.
  const cells = $derived([
    ...Array.from({ length: data.firstWeekday }, () => null),
    ...Array.from({ length: data.daysInMonth }, (_, i) => i + 1)
  ]);

  function key(day: number) {
    return `${data.y}-${pad(data.m)}-${pad(day)}`;
  }
  function time(iso: string) {
    return iso.slice(11, 16);
  }
  function chipClass(status: string) {
    if (status === 'pending') return 'bg-amber-500/15 text-amber-800';
    if (status === 'confirmed' || status === 'completed') return 'bg-emerald-600/15 text-emerald-800';
    return 'bg-black/5 text-[var(--color-bone-dim)]';
  }
</script>

<div class="mx-auto max-w-5xl px-5 sm:px-6 py-8">
  <div class="flex items-center justify-between gap-4 mb-6">
    <div>
      <h1 class="display text-3xl">{data.monthLabel}</h1>
      <p class="text-sm text-[var(--color-bone-dim)] mt-1">{data.total} booking{data.total === 1 ? '' : 's'}</p>
    </div>
    <div class="flex items-center gap-2">
      <a href="?m={data.prevM}" class="btn-icon" aria-label="Previous month">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
      </a>
      <a href="/admin/calendar" class="pill">Today</a>
      <a href="?m={data.nextM}" class="btn-icon" aria-label="Next month">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </a>
    </div>
  </div>

  <div class="grid grid-cols-7 gap-1 mb-1">
    {#each weekdays as w (w)}
      <div class="text-center text-[11px] uppercase tracking-wide text-[var(--color-bone-faint)] py-1">{w}</div>
    {/each}
  </div>

  <div class="grid grid-cols-7 gap-1">
    {#each cells as cell, i (i)}
      {#if cell === null}
        <div class="min-h-[5.5rem] rounded-lg"></div>
      {:else}
        {@const k = key(cell)}
        {@const list = data.byDay[k] ?? []}
        {@const isToday = k === data.todayStr}
        <div
          class="min-h-[5.5rem] rounded-lg border p-1.5 {isToday
            ? 'border-[var(--gold-500)] bg-[var(--gold-tint)]'
            : 'border-[var(--color-line)] bg-[var(--ivory)]'}">
          <div class="text-xs font-medium {isToday ? 'text-[var(--gold-700)]' : 'text-[var(--color-bone-dim)]'} mb-1">
            {cell}
          </div>
          <div class="space-y-1">
            {#each list.slice(0, 3) as b (b.id)}
              <div class="rounded px-1.5 py-0.5 text-[11px] leading-tight truncate {chipClass(b.status)}" title="{time(b.starts_at)} {b.customer_name} · {b.service_name} · {b.barber_name ?? 'Any'}">
                <span class="tnum font-medium">{time(b.starts_at)}</span> {b.customer_name}
              </div>
            {/each}
            {#if list.length > 3}
              <div class="text-[11px] text-[var(--color-bone-faint)] px-1">+{list.length - 3} more</div>
            {/if}
          </div>
        </div>
      {/if}
    {/each}
  </div>

  <div class="flex flex-wrap gap-4 mt-5 text-xs text-[var(--color-bone-dim)]">
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-amber-500/30"></span> Pending</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-emerald-600/30"></span> Confirmed / completed</span>
    <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-sm bg-black/10"></span> No-show</span>
  </div>
</div>
