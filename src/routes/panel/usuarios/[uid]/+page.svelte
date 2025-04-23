<!-- src/routes/panel/usuarios/[uid]/+page.svelte -->
<script lang="ts">
    import type { PageData } from './$types';
    import type { DatosUsuario } from '$lib/types';
    import { Edit, DocumentPdf, Image, Save, Close } from 'carbon-icons-svelte';
    import { doc, updateDoc } from 'firebase/firestore';
    import { dbUsers } from '$lib/client';
    import { tick } from 'svelte';
    import { BarLoader } from "svelte-loading-spinners"; // <-- Importar BarLoader
  import SectionName from '$lib/components/ui/SectionName.svelte';
  
    export let data: PageData;
  
    // Copia profunda inicial para poder cancelar/editar
    let usuario: DatosUsuario = JSON.parse(JSON.stringify(data.usuario));
    let originalUsuarioData: DatosUsuario = JSON.parse(JSON.stringify(data.usuario));
  
    let editMode = false;
    let isSaving = false;
    let saveMessage = '';
    let saveMessageType: 'success' | 'error' | '' = '';
  
    // Variable string para manejar 'dias_laborables' en el input
    let diasLaborablesString = '';
  
    // --- Lógica para Editar y Guardar ---
  
    async function toggleEditMode() {
      if (editMode) {
        // Guardar cambios si estábamos en modo edición
        await guardarCambiosUsuario();
      } else {
        // Entrar en modo edición
        saveMessage = ''; // Limpiar mensajes
        saveMessageType = '';
        usuario = JSON.parse(JSON.stringify(originalUsuarioData)); // Reiniciar con los datos originales guardados
  
        // Asegurar que domicilio exista para editar campos anidados
        if (!usuario.domicilio) {
          usuario.domicilio = { calle: '', colonia: '', cp: '', estado: '', numero_ext: '', numero_int: '' };
        }
  
        // Inicializar diasLaborablesString desde el array actual
        diasLaborablesString = usuario.dias_laborables?.join(', ') || '';
  
        editMode = true;
        await tick(); // Esperar renderizado de inputs
      }
    }
  
    function cancelEdit() {
      // Restaurar datos originales y salir del modo edición
      usuario = JSON.parse(JSON.stringify(originalUsuarioData));
      editMode = false;
      isSaving = false;
      saveMessage = '';
      saveMessageType = '';
    }
  
    async function guardarCambiosUsuario() {
      if (!usuario || !usuario.uid || isSaving) {
          if (!usuario || !usuario.uid) {
              saveMessage = "Error: No se puede guardar sin UID de usuario.";
               saveMessageType = 'error';
          }
        return; // Prevenir guardado sin UID o doble click
      }
  
      isSaving = true;
      saveMessage = ''; // Limpiar mensaje anterior, el loader indicará progreso
      saveMessageType = '';
  
      const userDocRef = doc(dbUsers, 'users', usuario.uid);
  
      // Convertir el string 'diasLaborablesString' de nuevo a array
      const diasLaborablesArray = diasLaborablesString
          .split(',')
          .map(d => d.trim()) // Quitar espacios extra
          .filter(d => d !== ''); // Quitar elementos vacíos (por comas seguidas o al final)
  
      // Objeto con los datos a actualizar
      const dataToUpdate = {
        nombre_completo: usuario.nombre_completo || '',
        username: usuario.username || '',
        email: usuario.email || '',
        puesto: usuario.puesto || '',
        role: usuario.role || '',
        curp: usuario.curp || '',
        rfc: usuario.rfc || '',
        edad: usuario.edad || null,
        genero: usuario.genero || '',
        estado_civil: usuario.estado_civil || '',
        fecha_ingreso: usuario.fecha_ingreso || '',
        lugar_ciudad: usuario.lugar_ciudad || '',
        lugar_fecha: usuario.lugar_fecha || '',
        dias_laborables: diasLaborablesArray, // <-- Usar el array procesado
        domicilio: usuario.domicilio ? {
            calle: usuario.domicilio.calle || '',
            colonia: usuario.domicilio.colonia || '',
            cp: usuario.domicilio.cp || '',
            estado: usuario.domicilio.estado || '',
            numero_ext: usuario.domicilio.numero_ext || '',
            numero_int: usuario.domicilio.numero_int || '',
        } : null,
      };
  
      try {
        await updateDoc(userDocRef, dataToUpdate);
        // Éxito
        originalUsuarioData = JSON.parse(JSON.stringify(usuario)); // Actualizar la 'copia original'
        originalUsuarioData.dias_laborables = diasLaborablesArray; // Asegurar que el array esté actualizado en la copia original también
        editMode = false;
        saveMessage = '¡Perfil actualizado correctamente!';
        saveMessageType = 'success';
      } catch (error: any) {
        console.error("Error al actualizar usuario:", error);
        saveMessage = `Error al guardar: ${error.message}`;
        saveMessageType = 'error';
        // Mantenemos editMode = true para corregir
      } finally {
        isSaving = false; // Termina el estado de guardado
      }
    }
  
    // Helper para formatear fechas
    function formatDate(dateInput: string | undefined | { toDate: () => Date }) {
      // ... (sin cambios)
       if (!dateInput) return 'N/A';
        try {
          let date: Date;
          if (typeof dateInput === 'string') {
            // Intentar parsear como YYYY-MM-DD o ISO string
            if (!dateInput.includes('T') && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
               // Añadir tiempo para evitar problemas de zona horaria al parsear solo fecha
               date = new Date(`${dateInput}T00:00:00`);
            } else {
               date = new Date(dateInput);
            }
          } else if (typeof dateInput === 'object' && dateInput !== null && 'toDate' in dateInput) {
            date = dateInput.toDate();
          } else {
            return 'Fecha inválida (tipo)';
          }
  
          if (isNaN(date.getTime())) {
             return 'Fecha inválida (valor)';
          }
          return date.toLocaleDateString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric'
          });
        } catch(e) {
          console.error("Error formateando fecha:", dateInput, e);
          return String(dateInput);
        }
    }
  
  </script>
  <SectionName Title={usuario.username}>
  <div class="perfil-usuario p-6 bg-white ">
    <div class="flex justify-between items-start mb-6 pb-4 border-b">
      <div>
        <h1 class="text-2xl font-semibold">Perfil de Usuario</h1>
         {#if usuario} <p class="text-sm text-gray-500">ID: {usuario.uid}</p>{/if}
      </div>
      <div class="flex gap-2">
         {#if editMode}
            <!-- Botón Cancelar -->
            <button on:click={cancelEdit} disabled={isSaving} class="btn-secondary" title="Cancelar Edición">
               <Close /> Cancelar
            </button>
             <!-- Botón Guardar -->
             <button on:click={guardarCambiosUsuario} disabled={isSaving} class="btn-primary" title="Guardar Cambios">
               <Save /> Guardar
             </button>
         {:else}
           <!-- Botón Editar -->
           <button on:click={toggleEditMode} class="btn-primary" title="Editar Perfil">
             <Edit /> Editar
           </button>
         {/if}
      </div>
    </div>
  
    <!-- Área de Mensajes de Feedback y Loader -->
    {#if isSaving}
       <div class="p-3 rounded mb-4 text-center bg-blue-100">
         <BarLoader color="#3B82F6" size="60" unit="px" duration="1s" />
          <span class="ml-2 text-blue-700">Guardando...</span>
       </div>
    {:else if saveMessage}
      <div
        class="p-3 rounded mb-4 text-center text-white"
        class:bg-green-500={saveMessageType === 'success'}
        class:bg-red-500={saveMessageType === 'error'}
      >
        {saveMessage}
      </div>
    {/if}
  
    {#if usuario}
      <form on:submit|preventDefault={() => { if(editMode) guardarCambiosUsuario(); }}>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
  
          <!-- Columna 1: Información General -->
          <section class="space-y-3">
            <h2 class="text-xl font-medium mb-3 border-b pb-1">Información General</h2>
  
            <!-- Nombre Completo -->
            <div class="field-group">
              <label class="label-field" for="nombre_completo">Nombre Completo:</label>
              {#if editMode} <input class="input-field" id="nombre_completo" type="text" bind:value={usuario.nombre_completo} disabled={isSaving}>{:else}<p class="data-field">{usuario.nombre_completo || 'N/A'}</p>{/if}
            </div>
            <!-- Username -->
            <div class="field-group">
               <label class="label-field" for="username">Username:</label>
               {#if editMode} <input class="input-field" id="username" type="text" bind:value={usuario.username} disabled={isSaving}>{:else}<p class="data-field">{usuario.username || 'N/A'}</p>{/if}
            </div>
            <!-- Email -->
             <div class="field-group">
               <label class="label-field" for="email">Email:</label>
               {#if editMode} <input class="input-field" id="email" type="email" bind:value={usuario.email} disabled={isSaving}>{:else}<p class="data-field">{usuario.email || 'N/A'}</p>{/if}
             </div>
            <!-- Puesto -->
            <div class="field-group">
              <label class="label-field" for="puesto">Puesto:</label>
              {#if editMode} <input class="input-field" id="puesto" type="text" bind:value={usuario.puesto} disabled={isSaving}>{:else}<p class="data-field">{usuario.puesto || 'N/A'}</p>{/if}
            </div>
            <!-- Rol -->
            <div class="field-group">
               <label class="label-field" for="role">Rol:</label>
               {#if editMode}
                  <select class="input-field" id="role" bind:value={usuario.role} disabled={isSaving}>
                     <option value="admin">Admin</option>
                     <option value="empleado">Empleado</option>
                     <option value="visor">Visor</option>
                  </select>
               {:else}<p class="data-field">{usuario.role || 'N/A'}</p>{/if}
            </div>
            <!-- Estado (No editable aquí) -->
            <div class="field-group">
              <!-- Usar div en lugar de label para texto estático -->
              <div class="label-field">Estado:</div>
              <p class="data-field"><span class={usuario.isBlocked ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{usuario.isBlocked ? 'Bloqueado' : 'Activo'}</span> <span class="text-xs text-gray-500 ml-2">(Gestionar desde tabla)</span></p>
            </div>
            <!-- Fecha Ingreso -->
            <div class="field-group">
              <label class="label-field" for="fecha_ingreso">Fecha de Ingreso:</label>
               {#if editMode}
                 <input class="input-field" id="fecha_ingreso" type="date" bind:value={usuario.fecha_ingreso} disabled={isSaving}>
                 <span class="text-xs text-gray-500 block mt-1">Formato: YYYY-MM-DD</span>
               {:else}<p class="data-field">{formatDate(usuario.fecha_ingreso)}</p>{/if}
            </div>
            <!-- Registrado En (No editable) -->
            <div class="field-group">
               <!-- Usar div en lugar de label -->
               <div class="label-field">Registrado en:</div>
               <p class="data-field">{formatDate(usuario.created_at)}</p>
            </div>
  
            <!-- Detalles Adicionales -->
             <h2 class="text-xl font-medium mb-3 border-b pb-1 pt-4">Detalles Adicionales</h2>
             <!-- CURP -->
             <div class="field-group">
               <label class="label-field" for="curp">CURP:</label>
               {#if editMode} <input class="input-field" id="curp" type="text" bind:value={usuario.curp} disabled={isSaving}>{:else}<p class="data-field">{usuario.curp || 'N/A'}</p>{/if}
             </div>
             <!-- RFC -->
              <div class="field-group">
               <label class="label-field" for="rfc">RFC:</label>
               {#if editMode} <input class="input-field" id="rfc" type="text" bind:value={usuario.rfc} disabled={isSaving}>{:else}<p class="data-field">{usuario.rfc || 'N/A'}</p>{/if}
             </div>
             <!-- Edad -->
             <div class="field-group">
                  <label class="label-field" for="edad">Edad:</label>
                  {#if editMode} <input class="input-field" id="edad" type="number" bind:value={usuario.edad} disabled={isSaving}>{:else}<p class="data-field">{usuario.edad || 'N/A'}</p>{/if}
              </div>
             <!-- Género -->
               <div class="field-group">
                  <label class="label-field" for="genero">Género:</label>
                  {#if editMode} <input class="input-field" id="genero" type="text" bind:value={usuario.genero} disabled={isSaving}>{:else}<p class="data-field">{usuario.genero || 'N/A'}</p>{/if}
              </div>
             <!-- Estado Civil -->
               <div class="field-group">
                  <label class="label-field" for="estado_civil">Estado Civil:</label>
                  {#if editMode} <input class="input-field" id="estado_civil" type="text" bind:value={usuario.estado_civil} disabled={isSaving}>{:else}<p class="data-field">{usuario.estado_civil || 'N/A'}</p>{/if}
              </div>
             <!-- Días Laborables -->
               <div class="field-group">
                  <!-- Corregido: Añadido for="dias_laborables" -->
                  <label class="label-field" for="dias_laborables">Días Laborables:</label>
                  {#if editMode}
                    <!-- Vinculado a la variable string auxiliar -->
                    <input class="input-field" id="dias_laborables" type="text" bind:value={diasLaborablesString} placeholder="Lunes, Martes, Miércoles..." disabled={isSaving}>
                    <span class="text-xs text-gray-500 block mt-1">Separar por comas.</span>
                  {:else}
                    <p class="data-field">{usuario.dias_laborables?.join(', ') || 'N/A'}</p>
                  {/if}
              </div>
             <!-- Lugar Ciudad -->
               <div class="field-group">
                  <label class="label-field" for="lugar_ciudad">Lugar Ciudad (Contrato?):</label>
                  {#if editMode} <input class="input-field" id="lugar_ciudad" type="text" bind:value={usuario.lugar_ciudad} disabled={isSaving}>{:else}<p class="data-field">{usuario.lugar_ciudad || 'N/A'}</p>{/if}
              </div>
             <!-- Lugar Fecha -->
               <div class="field-group">
                  <label class="label-field" for="lugar_fecha">Fecha (Contrato?):</label>
                  {#if editMode}
                    <input class="input-field" id="lugar_fecha" type="date" bind:value={usuario.lugar_fecha} disabled={isSaving}>
                    <span class="text-xs text-gray-500 block mt-1">Formato: YYYY-MM-DD</span>
                  {:else}<p class="data-field">{formatDate(usuario.lugar_fecha)}</p>{/if}
              </div>
          </section>
  
          <!-- Columna 2: Domicilio y Documentos -->
          <section class="space-y-3">
            <h2 class="text-xl font-medium mb-3 border-b pb-1">Domicilio</h2>
            {#if editMode}
               {#if !usuario.domicilio || !(usuario.domicilio.calle || usuario.domicilio.colonia) }
                  <p class="text-sm text-gray-500">No hay domicilio registrado o está incompleto. Rellena los campos para agregarlo/completarlo.</p>
               {/if}
               <!-- Inputs Domicilio -->
                <div class="field-group"> <label class="label-field" for="dom_calle">Calle:</label> <input class="input-field" id="dom_calle" type="text" bind:value={usuario.domicilio.calle} disabled={isSaving}> </div>
                 <div class="field-group"> <label class="label-field" for="dom_num_ext">Nº Ext:</label> <input class="input-field" id="dom_num_ext" type="text" bind:value={usuario.domicilio.numero_ext} disabled={isSaving}> </div>
                 <div class="field-group"> <label class="label-field" for="dom_num_int">Nº Int:</label> <input class="input-field" id="dom_num_int" type="text" bind:value={usuario.domicilio.numero_int} disabled={isSaving}> </div>
                 <div class="field-group"> <label class="label-field" for="dom_colonia">Colonia:</label> <input class="input-field" id="dom_colonia" type="text" bind:value={usuario.domicilio.colonia} disabled={isSaving}> </div>
                 <div class="field-group"> <label class="label-field" for="dom_cp">CP:</label> <input class="input-field" id="dom_cp" type="text" bind:value={usuario.domicilio.cp} disabled={isSaving}> </div>
                 <div class="field-group"> <label class="label-field" for="dom_estado">Estado:</label> <input class="input-field" id="dom_estado" type="text" bind:value={usuario.domicilio.estado} disabled={isSaving}> </div>
            {:else if usuario.domicilio && (usuario.domicilio.calle || usuario.domicilio.colonia)}
              <!-- Mostrar domicilio si existe y tiene calle o colonia -->
              <p class="data-field">{usuario.domicilio.calle || ''} #{usuario.domicilio.numero_ext || ''} {usuario.domicilio.numero_int ? `Int. ${usuario.domicilio.numero_int}` : ''}</p>
              <p class="data-field">Col. {usuario.domicilio.colonia || ''}, C.P. {usuario.domicilio.cp || ''}</p>
              <p class="data-field">{usuario.domicilio.estado || ''}</p>
            {:else}
              <p class="data-field text-gray-500">No hay información de domicilio registrada.</p>
            {/if}
  
            <h2 class="text-xl font-medium mb-3 border-b pb-1 pt-4">Documentos</h2>
            {#if usuario.documents && Object.keys(usuario.documents).length > 0}
               <ul class="list-none space-y-2">
                {#if usuario.documents.workerPhoto}<li>
                  <img class="object-cover w-30 " src={usuario.documents.workerPhoto} alt={usuario.username} >
                  <a href={usuario.documents.workerPhoto} target="_blank" rel="noopener noreferrer" class="link-documento"><Image class="icon-doc"/> Foto Trabajador</a>
                </li>{/if}
                  {#if usuario.documents.ineFront}<li>
                    <img class="object-cover w-20 " src={usuario.documents.ineFront} alt={usuario.username} >
                    <a href={usuario.documents.ineFront} target="_blank" rel="noopener noreferrer" class="link-documento"><Image class="icon-doc"/> INE (Frente)</a>
                  </li>{/if}
                  {#if usuario.documents.ineBack}<li>
                    <img class="object-cover w-20 " src={usuario.documents.ineBack} alt={usuario.username} >
                    <a href={usuario.documents.ineBack} target="_blank" rel="noopener noreferrer" class="link-documento"><Image class="icon-doc"/> INE (Reverso)</a>
                  </li>{/if}
                  {#if usuario.documents.waiver}<li><a href={usuario.documents.waiver} target="_blank" rel="noopener noreferrer" class="link-documento"><DocumentPdf class="icon-doc"/>Descargar Carta</a>
                  </li>{/if}
                 
                </ul>
            {:else}
              <p class="data-field text-gray-500">No hay documentos registrados.</p>
            {/if}
            {#if editMode}
              <p class="text-sm text-gray-500 mt-4">La carga/actualización de documentos debe implementarse por separado.</p>
            {/if}
  
          </section>
        </div>
      </form>
    {:else}
      <p class="text-center text-red-500">No se pudieron cargar los datos del usuario.</p>
    {/if}
  </div>

</SectionName>
  
  <style>
    /* Estilos base con UnoCSS */
    .perfil-usuario { --at-apply: font-sans; }
    .label-field { --at-apply: block text-sm font-medium text-gray-700 mb-1; }
    .input-field { --at-apply: w-full p-2 border border-gray-300 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100; }
    .data-field { --at-apply: mt-1 text-gray-900 min-h-[2.5rem] flex items-center px-1; } /* Añadido min-h y padding para alinear */
    .field-group { --at-apply: mb-4; } /* Aumentado margen inferior */
    .link-documento { --at-apply: text-blue-600 hover:underline flex items-center gap-1 text-sm; }
    /* .icon-doc { --at-apply: inline-block w-4 h-4; }
   */
    /* Clases para botones (Ejemplo, adapta a tu sistema) */
    .btn-primary { --at-apply: flex items-center gap-2 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50; }
    .btn-secondary { --at-apply: flex items-center gap-2 px-4 py-2 rounded text-white bg-gray-500 hover:bg-gray-600 disabled:opacity-50; }
    .btn-save { --at-apply: flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50; } 

  
    /* Los estilos para feedback/loader ya usan class: de Svelte */
  
    /* Estilos específicos para BarLoader si necesitas anular */
    /* .perfil-usuario :global(.svelte-spinner) { ... } */
  
  </style>