<!-- src/routes/panel/usuarios/usuario/[uid]/+page.svelte -->
<script lang="ts">
    import type { PageData } from './$types';
    import type { DatosUsuario } from '$lib/types'; // Importa el tipo completo
    import { Edit, DocumentPdf, Image } from 'carbon-icons-svelte'; // Iconos ejemplo
  
    export let data: PageData; // Recibe los datos de la función load
  
    // Accede a los datos del usuario
    let usuario: DatosUsuario = data.usuario;
  
    // --- Lógica para Editar (Ejemplo básico) ---
    let editMode = false;
  
    function toggleEditMode() {
      editMode = !editMode;
      if (!editMode) {
        // Aquí llamarías a la función para guardar los cambios en Firebase
        console.log("Guardando cambios (implementar lógica Firebase)...", usuario);
        // Llama a una función tipo: await guardarCambiosUsuario(usuario);
      }
    }
  
    // Función placeholder para guardar (Necesitas implementarla con updateDoc)
    async function guardarCambiosUsuario(datos: DatosUsuario) {
      // import { doc, updateDoc } from 'firebase/firestore';
      // import { dbUsers } from '$lib/client';
      // const userDocRef = doc(dbUsers, 'users', datos.uid);
      // try {
      //   await updateDoc(userDocRef, {
      //      // ... solo los campos que quieres actualizar
      //      nombre_completo: datos.nombre_completo,
      //      puesto: datos.puesto,
      //      // ... otros campos editables
      //   });
      //   console.log("Usuario actualizado");
      //   editMode = false; // Salir del modo edición al guardar
      // } catch (error) {
      //   console.error("Error al actualizar usuario:", error);
      //   // Mostrar mensaje de error al usuario
      // }
    }
  
    // Función helper para formatear fechas (si vienen como ISO string)
    function formatDate(dateString: string | undefined) {
      if (!dateString) return 'N/A';
      try {
        return new Date(dateString).toLocaleDateString('es-ES', {
          year: 'numeric', month: 'long', day: 'numeric'
        });
      } catch {
        return dateString; // Devuelve el string original si no se puede parsear
      }
    }
  
  </script>
  <section >
  <div class="perfil-usuario p-6 bg-white rounded-lg shadow-md px-12">
    <div class="flex justify-between items-center mb-6 pb-4 border-b">
      <h1 class="text-2xl font-semibold">Perfil de Usuario</h1>
      <button
        on:click={toggleEditMode}
        class="flex items-center gap-2 px-4 py-2 text-white"
        class:bg-blue-6={!editMode}
        class:hover:bg-blue-7={!editMode}
        class:bg-green-6={editMode}
        class:hover:bg-green-7={editMode}
      >
        <Edit />
        {editMode ? 'Guardar Cambios' : 'Editar Perfil'}
      </button>
    </div>
  
    {#if usuario}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
  
        <!-- Columna 1: Información Personal y Laboral -->
        <section class="space-y-4">
          <h2 class="text-xl font-medium mb-3 border-b pb-1">Información General</h2>
  
          {#if editMode}
            <label class="block">Nombre Completo: <input class="input-field" type="text" bind:value={usuario.nombre_completo}></label>
            <label class="block">Username: <input class="input-field" type="text" bind:value={usuario.username}></label>
            <label class="block">Email: <input class="input-field" type="email" bind:value={usuario.email}></label>
            <label class="block">Puesto: <input class="input-field" type="text" bind:value={usuario.puesto}></label>
            <label class="block">Rol:
               <select class="input-field" bind:value={usuario.role}>
                  <option value="admin">Admin</option>
                  <option value="empleado">Empleado</option>
                  <option value="visor">Visor</option>
                   <!-- Añade más roles si existen -->
               </select>
            </label>
            <label class="block">Estado: <span class={usuario.isBlocked ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{usuario.isBlocked ? 'Bloqueado' : 'Activo'}</span> (Bloquear/Desbloquear desde la tabla)</label>
  
          {:else}
            <p><strong>Nombre Completo:</strong> {usuario.nombre_completo || 'N/A'}</p>
            <p><strong>Username:</strong> {usuario.username || 'N/A'}</p>
            <p><strong>Email:</strong> {usuario.email || 'N/A'}</p>
            <p><strong>Puesto:</strong> {usuario.puesto || 'N/A'}</p>
            <p><strong>Rol:</strong> {usuario.role || 'N/A'}</p>
             <p><strong>Estado:</strong> <span class={usuario.isBlocked ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{usuario.isBlocked ? 'Bloqueado' : 'Activo'}</span></p>
            <p><strong>Fecha de Ingreso:</strong> {formatDate(usuario.fecha_ingreso)}</p>
             <p><strong>Registrado en:</strong> {formatDate(usuario.created_at)}</p>
          {/if}
  
          <h2 class="text-xl font-medium mb-3 border-b pb-1 pt-4">Detalles Adicionales</h2>
           {#if editMode}
              <label class="block">CURP: <input class="input-field" type="text" bind:value={usuario.curp}></label>
              <label class="block">RFC: <input class="input-field" type="text" bind:value={usuario.rfc}></label>
              <label class="block">Edad: <input class="input-field" type="number" bind:value={usuario.edad}></label>
              <label class="block">Género: <input class="input-field" type="text" bind:value={usuario.genero}></label>
               <label class="block">Estado Civil: <input class="input-field" type="text" bind:value={usuario.estado_civil}></label>
              <!-- Días laborables podría ser un multi-select o checkboxes en modo edición -->
  
           {:else}
              <p><strong>CURP:</strong> {usuario.curp || 'N/A'}</p>
              <p><strong>RFC:</strong> {usuario.rfc || 'N/A'}</p>
              <p><strong>Edad:</strong> {usuario.edad || 'N/A'}</p>
              <p><strong>Género:</strong> {usuario.genero || 'N/A'}</p>
              <p><strong>Estado Civil:</strong> {usuario.estado_civil || 'N/A'}</p>
              <p><strong>Días Laborables:</strong> {usuario.dias_laborables?.join(', ') || 'N/A'}</p>
              <p><strong>Lugar y Fecha (Contrato?):</strong> {usuario.lugar_ciudad}, {formatDate(usuario.lugar_fecha)}</p>
           {/if}
        </section>
  
        <!-- Columna 2: Domicilio y Documentos -->
        <section class="space-y-4">
          <h2 class="text-xl font-medium mb-3 border-b pb-1">Domicilio</h2>
           {#if editMode && usuario.domicilio}
              <label>Calle: <input class="input-field" type="text" bind:value={usuario.domicilio.calle}></label>
              <label>Nº Ext: <input class="input-field" type="text" bind:value={usuario.domicilio.numero_ext}></label>
              <label>Nº Int: <input class="input-field" type="text" bind:value={usuario.domicilio.numero_int}></label>
              <label>Colonia: <input class="input-field" type="text" bind:value={usuario.domicilio.colonia}></label>
              <label>CP: <input class="input-field" type="text" bind:value={usuario.domicilio.cp}></label>
              <label>Estado: <input class="input-field" type="text" bind:value={usuario.domicilio.estado}></label>
           {:else if usuario.domicilio}
            <p>{usuario.domicilio.calle || ''} #{usuario.domicilio.numero_ext || ''} {usuario.domicilio.numero_int ? `Int. ${usuario.domicilio.numero_int}` : ''}</p>
            <p>Col. {usuario.domicilio.colonia || ''}, C.P. {usuario.domicilio.cp || ''}</p>
            <p>{usuario.domicilio.estado || ''}</p>
           {:else}
             <p>No hay información de domicilio registrada.</p>
           {/if}
  
  
          <h2 class="text-xl font-medium mb-3 border-b pb-1 pt-4">Documentos</h2>
          {#if usuario.documents && Object.keys(usuario.documents).length > 0}
            <ul class="list-none space-y-2">
              {#if usuario.documents.ineFront}
                <li>
                    <img class=" object-cover  w-30 " src={usuario.documents.ineFront} alt={usuario.nombre_completo || 'N/A'} >
                    <a href={usuario.documents.ineFront} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline flex items-center gap-2"><Image /> INE (Frente)</a></li>
              {/if}
               {#if usuario.documents.ineBack}
                <li> <img class=" object-cover  w-30 " src={usuario.documents.ineBack} alt={usuario.nombre_completo || 'N/A'} >
                    <a href={usuario.documents.ineBack} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline flex items-center gap-2"><Image /> INE (Reverso)</a></li>
              {/if}
               {#if usuario.documents.waiver}
                <li><a href={usuario.documents.waiver} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline flex items-center gap-2"><DocumentPdf /> Waiver / Carta</a></li>
              {/if}
               {#if usuario.documents.workerPhoto}
                <li> <img class=" object-cover  w-30 " src={usuario.documents.workerPhoto} alt={usuario.nombre_completo || 'N/A'} >
                    <a href={usuario.documents.workerPhoto} target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline flex items-center gap-2">
                   
                    <Image /> Descarga Foto</a></li>
              {/if}
              <!-- Agrega más documentos si existen -->
            </ul>
             {#if editMode}
               <p class="text-sm text-gray-500 mt-4">La carga/actualización de documentos se debe implementar por separado.</p>
             {/if}
          {:else}
            <p>No hay documentos registrados.</p>
             {#if editMode}
               <p class="text-sm text-gray-500 mt-4">Implementar funcionalidad para cargar documentos.</p>
             {/if}
          {/if}
  
        </section>
  
      </div>
    {:else}
      <p class="text-center text-red-500">No se pudieron cargar los datos del usuario.</p>
    {/if}
  </div>
</section>
  <style>
    /* Estilos básicos para los inputs en modo edición (Usa clases UnoCSS si prefieres) */
    .input-field {
      --at-apply: w-full p-2 border border-gray-300 rounded mt-1;
    }
     label {
       --at-apply: text-sm font-medium text-gray-700;
     }
     /* Asegúrate de tener estilos para app.css o usar UnoCSS para p, strong, h1, h2, etc. */
      /* Ejemplo de clases UnoCSS que podrías usar en línea o en <style> */
     /* p { --at-apply: mb-2 text-gray-800; } */
     /* strong { --at-apply: font-semibold text-gray-900; } */
  
  </style>