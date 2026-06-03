<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="max-w-sm mx-auto py-12">
  <h1 class="text-xl font-semibold mb-4">Admin</h1>
  {#if !data.configured}
    <div class="text-sm text-red-600 mb-4">
      Admin not configured. Set <code>ADMIN_PASSWORD_HASH</code> and
      <code>SESSION_SECRET</code> as Pages secrets.
    </div>
  {/if}
  <form method="POST" class="grid gap-3">
    <label class="block">
      <span class="text-sm">Password</span>
      <input
        type="password"
        name="password"
        required
        autocomplete="current-password"
        class="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2" />
    </label>
    {#if form && 'error' in form && form.error === 'invalid'}
      <div class="text-sm text-red-600">Incorrect password.</div>
    {/if}
    <button type="submit" class="rounded-lg bg-neutral-900 text-white py-2">Sign in</button>
  </form>
</div>
