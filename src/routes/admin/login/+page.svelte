<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="mx-auto max-w-sm px-5 py-20">
  <p class="eyebrow rise rise-1">Balis Barber</p>
  <h1 class="display text-3xl mt-3 mb-6 rise rise-2">Admin sign in</h1>

  {#if !data.configured}
    <div class="text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-5">
      Admin not configured. Set <code class="text-amber-200">ADMIN_PASSWORD_HASH</code> and
      <code class="text-amber-200">SESSION_SECRET</code> as Pages secrets.
    </div>
  {/if}

  <form method="POST" class="grid gap-4 rise rise-2">
    <label class="block">
      <span class="text-sm font-medium text-[var(--color-bone-dim)]">Password</span>
      <input type="password" name="password" required autocomplete="current-password" class="field mt-1.5" />
    </label>
    {#if form && 'error' in form && form.error === 'invalid'}
      <div class="text-sm text-red-400">Incorrect password.</div>
    {/if}
    <button type="submit" class="btn btn-brass w-full">Sign in</button>
  </form>
</div>
