<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  function fmt(iso: string) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]} ${m[4]}:${m[5]}` : iso;
  }
</script>

<div class="mx-auto max-w-2xl px-5 sm:px-6 py-8">
  <a href="/admin" class="text-sm text-[var(--color-bone-dim)] hover:text-[var(--color-bone)] transition">← Back to bookings</a>
  <h1 class="display text-3xl mt-3 mb-6">Block time</h1>

  <form method="POST" action="?/create" class="glass p-5 grid gap-4">
    <label class="block">
      <span class="text-sm text-[var(--color-bone-dim)]">Barber</span>
      <select name="barber_id" class="field mt-1.5">
        <option value="">All barbers</option>
        {#each data.barbers as b}<option value={b.id}>{b.name}</option>{/each}
      </select>
    </label>
    <label class="block">
      <span class="text-sm text-[var(--color-bone-dim)]">Date</span>
      <input name="date" type="date" required class="field mt-1.5" />
    </label>
    <div class="grid grid-cols-2 gap-4">
      <label class="block">
        <span class="text-sm text-[var(--color-bone-dim)]">From</span>
        <input name="start" type="time" required class="field mt-1.5" />
      </label>
      <label class="block">
        <span class="text-sm text-[var(--color-bone-dim)]">To</span>
        <input name="end" type="time" required class="field mt-1.5" />
      </label>
    </div>
    <label class="block">
      <span class="text-sm text-[var(--color-bone-dim)]">Reason</span>
      <input name="reason" class="field mt-1.5" placeholder="Lunch, holiday, sick day…" />
    </label>
    <button class="btn btn-brass w-full">Add block</button>
  </form>

  <h2 class="eyebrow mt-9 mb-3">Upcoming blocks</h2>
  {#if data.blocks.length === 0}
    <p class="text-[var(--color-bone-dim)] text-sm">None.</p>
  {:else}
    <ul class="grid gap-2">
      {#each data.blocks as bl (bl.id)}
        <li class="glass flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <span class="text-[var(--color-bone)]">{bl.barber_name ?? 'All'}</span>
            <span class="text-[var(--color-bone-dim)] tnum"> · {fmt(bl.starts_at)} → {fmt(bl.ends_at)}</span>
            {#if bl.reason}<span class="text-[var(--color-bone-faint)]"> · {bl.reason}</span>{/if}
          </div>
          <form method="POST" action="?/delete">
            <input type="hidden" name="id" value={bl.id} />
            <button class="text-red-300 hover:text-red-200 transition">Remove</button>
          </form>
        </li>
      {/each}
    </ul>
  {/if}
</div>
