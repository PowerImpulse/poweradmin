<script>

    import { auth } from '$lib/client';
    import { signOut } from 'firebase/auth';
    import { goto } from '$app/navigation';
    import { user } from '$lib/stores';
    import PortOutput from "carbon-icons-svelte/lib/PortOutput.svelte";

    let errorMessage = '';
    const logout = async () => {
        try {

            goto('/');
            await signOut(auth);
            
        } catch (err) {
            if (err instanceof Error) {
        console.error('Error logging in:', err.message);
        errorMessage = err.message; // Set the error message
      } else {
        console.error('Unknown error', err);
        errorMessage = 'An unknown error occurred';
      }
    }
       
}

</script>

{#if $user}
  <button class="flex ic gap-2" on:click={logout}><PortOutput size={24} />
    <slot/>
  </button>
{/if}

{#if errorMessage}
  <p style="color: red;">{errorMessage}</p>
{/if}