<script lang="ts">
  import { enhance } from '$app/forms';

  let {
    id,
    startsAt,
    action = '?/setTime'
  }: { id: number; startsAt: string; action?: string } = $props();

  // "2026-06-05T18:15:00+08:00" -> "2026-06-05T18:15" for datetime-local
  const original = $derived(startsAt.slice(0, 16));
  // svelte-ignore state_referenced_locally
  let val = $state(startsAt.slice(0, 16));
  const changed = $derived(val !== original);
</script>

<form method="POST" {action} use:enhance class="flex items-center gap-1.5">
  <input type="hidden" name="id" value={id} />
  <input
    type="datetime-local"
    name="starts_local"
    bind:value={val}
    class="field !py-1.5 !w-auto !text-sm tnum"
    title="Reschedule" />
  {#if changed}
    <button class="btn btn-brass !py-1.5 !px-3 !text-sm">Save time</button>
  {/if}
</form>
