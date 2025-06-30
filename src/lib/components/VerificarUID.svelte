<script>
      import { currentUser } from '$lib/userStore';
</script>

<strong>Sesión activa como:</strong> {$currentUser.user?.email} <br>
      <strong>Rol (desde token):</strong> <span class="font-bold uppercase">{$currentUser.role || 'Sin Rol'} <br>UID: 
      {$currentUser.user?.uid} </span>

