<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();

  const days = [
    { d: 1, l: 'Monday' },
    { d: 2, l: 'Tuesday' },
    { d: 3, l: 'Wednesday' },
    { d: 4, l: 'Thursday' },
    { d: 5, l: 'Friday' },
    { d: 6, l: 'Saturday' },
    { d: 0, l: 'Sunday' }
  ];

  function hrs(barberId: number, d: number) {
    return data.hoursByBarber[barberId]?.[d];
  }
</script>

<div class="mx-auto max-w-3xl px-5 sm:px-6 py-8">
  <div class="flex items-center justify-between gap-3 mb-2">
    <h1 class="display text-3xl">Barbers & hours</h1>
    <span class="text-sm text-[var(--color-bone-dim)]">{data.barbers.length} total</span>
  </div>
  <p class="text-sm text-[var(--color-bone-dim)] mb-6">Set each barber's weekly availability. Unchecked days are days off.</p>

  {#if form && 'hoursSaved' in form}
    <div class="mb-4 text-sm text-emerald-800 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">Hours saved.</div>
  {:else if form && 'created' in form}
    <div class="mb-4 text-sm text-emerald-800 bg-emerald-600/10 border border-emerald-600/20 rounded-lg px-3 py-2">Barber added.</div>
  {/if}

  <details class="glass p-5 mb-6">
    <summary class="cursor-pointer font-medium">+ Add a barber</summary>
    <form method="POST" action="?/createBarber" class="grid sm:grid-cols-2 gap-3 mt-4">
      <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Name</span><input name="name" required class="field mt-1" /></label>
      <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Photo URL (optional)</span><input name="photo_url" class="field mt-1" placeholder="https://…" /></label>
      <div class="sm:col-span-2 text-right"><button class="btn btn-brass !py-2 !px-4 !text-sm">Add barber</button></div>
    </form>
  </details>

  <div class="grid gap-4">
    {#each data.barbers as b (b.id)}
      <div class="glass p-5 {b.active ? '' : 'opacity-60'}">
        <!-- Details -->
        <form method="POST" action="?/updateBarber" class="grid sm:grid-cols-2 gap-3">
          <input type="hidden" name="id" value={b.id} />
          <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Name</span><input name="name" value={b.name} class="field mt-1" /></label>
          <label class="block"><span class="text-xs text-[var(--color-bone-dim)]">Photo URL</span><input name="photo_url" value={b.photo_url ?? ''} class="field mt-1" placeholder="https://…" /></label>
          <div class="sm:col-span-2 flex items-center gap-4 text-sm">
            <label class="inline-flex items-center gap-2"><span class="text-xs text-[var(--color-bone-dim)]">Sort</span><input name="sort_order" type="number" value={b.sort_order} class="field !w-20 !py-1.5 tnum" /></label>
            <label class="inline-flex items-center gap-2"><input type="checkbox" name="active" checked={b.active === 1} /> Active</label>
            <button class="btn btn-brass !py-1.5 !px-4 !text-sm ml-auto">Save details</button>
          </div>
        </form>

        <hr class="hairline my-4" />

        <!-- Weekly hours -->
        <form method="POST" action="?/setHours">
          <input type="hidden" name="barber_id" value={b.id} />
          <div class="space-y-1.5">
            {#each days as day (day.d)}
              {@const h = hrs(b.id, day.d)}
              <div class="flex items-center gap-3 text-sm">
                <label class="inline-flex items-center gap-2 w-32 shrink-0">
                  <input type="checkbox" name="open_{day.d}" checked={!!h} /> {day.l}
                </label>
                <input type="time" name="from_{day.d}" value={h?.open_time ?? '09:00'} class="field !py-1.5 !w-28 tnum" />
                <span class="text-[var(--color-bone-faint)]">–</span>
                <input type="time" name="to_{day.d}" value={h?.close_time ?? '19:00'} class="field !py-1.5 !w-28 tnum" />
              </div>
            {/each}
          </div>
          <div class="text-right mt-3"><button class="btn btn-brass !py-1.5 !px-4 !text-sm">Save hours</button></div>
        </form>

        <form method="POST" action="?/removeBarber" class="mt-2 text-right">
          <input type="hidden" name="id" value={b.id} />
          <button class="text-xs text-red-600 hover:text-red-700">Remove barber</button>
        </form>
      </div>
    {/each}
  </div>
</div>
