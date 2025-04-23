<script lang="ts">
 // src/lib/usuarios/UsuarioEmail.svelte
   
   export let email: string;
   export let username: string;
    
</script>
   
<div>
    <p style="font-weight: 500;" >{username}</p>
    <span style="font-size: 12px;">{email}</span>
</div>