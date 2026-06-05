<script lang="ts">
  import { enhance } from '$app/forms';
  import type { Barber } from '$lib/db';

  let {
    id,
    barberId,
    barbers,
    action = '?/setBarber'
  }: { id: number; barberId: number | null; barbers: Barber[]; action?: string } = $props();

  const original = $derived(barberId == null ? '' : String(barberId));
  // svelte-ignore state_referenced_locally
  let selected = $state(barberId == null ? '' : String(barberId));
  const changed = $derived(selected !== original);
</script>

<form method="POST" {action} use:enhance class="flex items-center gap-1.5">
  <input type="hidden" name="id" value={id} />
  <select name="barber_id" bind:value={selected} class="field !py-1.5 !w-auto !text-sm" title="Assign barber">
    <option value="">Any barber</option>
    {#each barbers as bb (bb.id)}<option value={String(bb.id)}>{bb.name}</option>{/each}
  </select>
  {#if changed}
    <button class="btn btn-brass !py-1.5 !px-3 !text-sm">Save</button>
  {/if}
</form>
