<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/client';
  import { signInWithEmailAndPassword } from 'firebase/auth';
  import { isLoggedIn, loadingUser } from '$lib/stores';
  import { BarLoader } from "svelte-loading-spinners";

  let email = 'jean@iconmedios.com';
  let password = 'dXjNqEqD2fN8xWq';
  let errorMessage = '';

  const login = async () => {
    errorMessage = '';
    if (!email || !password) {
      errorMessage = 'Por favor, complete todos los campos.';
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
// Si el inicio es exitoso 
    } catch (error: any) {
      console.error('Error logging in:', error.message || 'Error desconocido');
      errorMessage = error.message || 'Error al iniciar sesión. Inténtalo de nuevo.';
    }
  };

  // Si ya está logueado, redirige automáticamente
  $: if (!$loadingUser && $isLoggedIn) {
    goto('/panel');
  }
</script>


<section class="h-screen bg-brand-1 flex icc">
  <div class="bg-slate-2 p-8 w-80% lg:w-120">  
    <h1 class="mb-8">Acceder</h1>

    {#if $loadingUser}
      <div class="flex justify-center py-8">
      <BarLoader color="#2563eb" />
      </div>
    {:else}
      <form on:submit|preventDefault={login}>
      <label>
        Email: <br>
        <input type="email" bind:value={email} required>
      </label>
      <label>
        Password: <br>
        <input type="password" bind:value={password} required>
      </label>
      <button class="p-2" type="submit">Entrar</button>
      </form>
    {/if}
    
    {#if errorMessage}
      <p style="color: red;">{errorMessage}</p>
    {/if}
  </div>
</section>

<style>
  form {
    --at-apply: flex flex-col gap-4;
  }
  label {
    --at-apply: text-3;
  }
  input {
    --at-apply: border-1 border-slate-3 p-2 w-full;
  }
</style>
