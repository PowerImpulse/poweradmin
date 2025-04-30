<script lang="ts">
  import type { PageData } from './$types';
  import type { DatosUsuario } from '$lib/types';
  import { Edit, DocumentPdf, Image, Save, Close } from 'carbon-icons-svelte';
  import { doc, updateDoc } from 'firebase/firestore';
  import { dbUsers } from '$lib/client';
  import { tick } from 'svelte';
  import { BarLoader } from "svelte-loading-spinners";
  import SectionName from '$lib/components/ui/SectionName.svelte';

  export let data: PageData;
  let editableDiasLaborables: string[] = [];

  // Asegurarse de que domicilio exista si no viene del fetch inicial
  let usuario: DatosUsuario = JSON.parse(JSON.stringify(data.usuario || {}));
  if (!usuario.domicilio) {
      usuario.domicilio = { calle: '', colonia: '', cp: '', estado: '', numero_ext: '', numero_int: '' };
  }
  // Copia de la versión inicial 
  let originalUsuarioData: DatosUsuario = JSON.parse(JSON.stringify(usuario)); 
  // Inicializar editableDiasLaborables con los datos existentes o con un campo vacío
    editableDiasLaborables = [...(usuario.dias_laborables || [])];
    // Asegurarse de que siempre haya al menos un campo vacío si la lista está vacía al inicio
    if (editableDiasLaborables.length === 0) {
        editableDiasLaborables = [''];   
    }

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
          // Restaurar con los datos originales guardados (que ya tienen domicilio asegurado)
          usuario = JSON.parse(JSON.stringify(originalUsuarioData));

          // REINICIALIZAR editableDiasLaborables 
          editableDiasLaborables = [...(usuario.dias_laborables || [])];
        if (editableDiasLaborables.length === 0) { // Asegurarse de que haya al menos un campo
            editableDiasLaborables = [''];
        }diasLaborablesString = usuario.dias_laborables?.join(', ') || '';

          editMode = true;
          // No es estrictamente necesario await tick() aquí, Svelte maneja la reactividad.
          // await tick();
      }
  }

  function cancelEdit() {
      // Restaurar datos originales y salir del modo edición
      usuario = JSON.parse(JSON.stringify(originalUsuarioData));
        editableDiasLaborables = [...(originalUsuarioData.dias_laborables || [])];
     if (editableDiasLaborables.length === 0) { // Asegurar al menos un campo
        editableDiasLaborables = [''];
     }
      editMode = false;
      isSaving = false;
      saveMessage = '';
      saveMessageType = '';
  }

  // Funciones para agregar/quitar días laborables en modo edición
const agregarDiaLaborable = () => {
    editableDiasLaborables = [...editableDiasLaborables, ''];
};

const quitarDiaLaborable = (index: number) => {
    // Permitir eliminar solo si hay más de un campo
    if (editableDiasLaborables.length > 1) {
        editableDiasLaborables = editableDiasLaborables.filter((_, i) => i !== index);
    } else {
         // Si solo queda uno, simplemente vaciarlo en lugar de quitarlo
         editableDiasLaborables = [''];
    }
};


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

     // PROCESAR editableDiasLaborables para guardar
        const diasLaboralesParaGuardar = editableDiasLaborables
        .map(d => d.trim())
        .filter(d => d !== '');

      // Objeto con los datos a actualizar
      const dataToUpdate = {
          nombre_completo: usuario.nombre_completo || '',
          username: usuario.username || '',
          email: usuario.email || '',
          puesto: usuario.puesto || '',
          role: usuario.role || '',
          curp: usuario.curp || '',
          rfc: usuario.rfc || '',
          edad: usuario.edad || null, // Mantener null si no hay valor
          genero: usuario.genero || '',
          estado_civil: usuario.estado_civil || '',
          fecha_ingreso: usuario.fecha_ingreso || '',
          lugar_ciudad: usuario.lugar_ciudad || '',
          lugar_fecha: usuario.lugar_fecha || '',
          dias_laborales: diasLaboralesParaGuardar,  
          domicilio: (usuario.domicilio && (usuario.domicilio.calle || usuario.domicilio.colonia || usuario.domicilio.cp || usuario.domicilio.estado || usuario.domicilio.numero_ext || usuario.domicilio.numero_int)) ? {
              calle: usuario.domicilio.calle || '',
              colonia: usuario.domicilio.colonia || '',
              cp: usuario.domicilio.cp || '',
              estado: usuario.domicilio.estado || '',
              // Usamos los nombres de campo de Firestore: numero_ext, numero_int
              numero_ext: usuario.domicilio.numero_ext || '',
              numero_int: usuario.domicilio.numero_int || '',
          } : null, // Guardar null si todos los campos de domicilio están vacíos
      };

      try {
          await updateDoc(userDocRef, dataToUpdate);
          // Éxito
          // Actualizar la 'copia original' con los datos guardados, incluyendo el array procesado
          originalUsuarioData = JSON.parse(JSON.stringify({...usuario, dias_laborables: diasLaboralesParaGuardar}));
         // Y actualizar editableDiasLaborables para reflejar el estado guardado
         editableDiasLaborables = [...(originalUsuarioData.dias_laborables || [])];
          if (editableDiasLaborables.length === 0) { // Asegurar al menos un campo
             editableDiasLaborables = [''];
          }
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
  function formatDate(dateInput: string | undefined | null | { toDate: () => Date }) {
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
         } else if (dateInput && typeof dateInput === 'object' && 'toDate' in dateInput && typeof dateInput.toDate === 'function') {
             // Firebase Timestamp object
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
         return String(dateInput); // Mostrar el valor original si hay un error
     }
  }

</script>

<SectionName Title={usuario.username || 'Cargando Usuario...'}>
  <div class="perfil-usuario p-6 bg-white ">
      <div class="flex justify-between items-start mb-6 pb-4 border-b">
          <div>
              <h1 class="text-2xl font-semibold">Perfil de Usuario</h1>
               {#if usuario && usuario.uid} <p class="text-sm text-gray-500">ID: {usuario.uid}</p>{/if}
          </div>
          <div class="flex gap-2">
              {#if editMode}
                  <button on:click={cancelEdit} disabled={isSaving} class="btn-secondary" title="Cancelar Edición">
                     <Close /> Cancelar
                  </button>
                  <button on:click={guardarCambiosUsuario} disabled={isSaving} class="btn-primary" title="Guardar Cambios">
                     <Save /> Guardar
                  </button>
              {:else}
                <button on:click={toggleEditMode} class="btn-primary" title="Editar Perfil">
                  <Edit /> Editar
                </button>
              {/if}
          </div>
      </div>

      {#if isSaving}
          <div class="p-3 rounded mb-4 text-center bg-blue-100 text-blue-700 flex items-center justify-center">
            <BarLoader color="#3B82F6" size="40" unit="px" duration="1s" />
             <span class="ml-2">Guardando...</span>
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

                  <section class="space-y-3">
                      <h2 class="text-xl font-medium mb-3 border-b pb-1">Información General</h2>

                      <div class="field-group">
                          <label class="label-field" for="nombre_completo">Nombre Completo:</label>
                          {#if editMode} <input class="input-field" id="nombre_completo" type="text" bind:value={usuario.nombre_completo} disabled={isSaving}>{:else}<p class="data-field">{usuario.nombre_completo || 'N/A'}</p>{/if}
                      </div>
                      <div class="field-group">
                          <label class="label-field" for="username">Username:</label>
                          {#if editMode} <input class="input-field" id="username" type="text" bind:value={usuario.username} disabled={isSaving}>{:else}<p class="data-field">{usuario.username || 'N/A'}</p>{/if}
                      </div>
                      <div class="field-group">
                          <label class="label-field" for="email">Email:</label>
                          {#if editMode} <input class="input-field" id="email" type="email" bind:value={usuario.email} disabled={isSaving}>{:else}<p class="data-field">{usuario.email || 'N/A'}</p>{/if}
                      </div>
                      <div class="field-group">
                          <label class="label-field" for="puesto">Puesto:</label>
                          {#if editMode}
                              <select
                                  class="input-field"
                                  id="puesto"
                                  bind:value={usuario.puesto}
                                  disabled={isSaving}
                              >
                                  <option value="" disabled selected>Selecciona un puesto</option>
                                  <option value="Técnico de servicio AA">Técnico de servicio AA</option>
                                  <option value="Técnico de servicio UPS">Técnico de servicio UPS</option>
                                  <option value="Coordinador de servicio AA">Coordinador de servicio AA</option>
                                  <option value="Coordinador de servicio UPS">Coordinador de servicio UPS</option>
                                  <option value="Almacenista/ayudante general">Almacenista/ayudante general</option>
                                  <option value="Logística y atención al cliente">Logística y atención al cliente</option>
                                  <option value="Ventas">Ventas</option>
                                  <option value="Coordinador de ventas">Coordinador de ventas</option>
                                  <option value="Técnico servicio plantas emergencia">Técnico servicio plantas emergencia</option>
                                  <option value="Coordinador servicio plantas emergencia">Coordinador servicio plantas emergencia</option>
                                  <option value="Recepción">Recepción</option>
                                  <option value="Recursos humanos">Recursos humanos</option>
                                  <option value="Instalador">Instalador</option>
                                  <option value="Asistente administrativo">Asistente administrativo</option>
                              </select>
                          {:else}
                              <p class="data-field">{usuario.puesto || 'N/A'}</p>
                          {/if}
                      </div>
                      <div class="field-group">
                          <label class="label-field" for="role">Rol:</label>
                          {#if editMode}
                              <select class="input-field" id="role" bind:value={usuario.role} disabled={isSaving}>
                                  <option value="admin">Admin</option>
                                  <option value="empleado">Empleado</option>
                                  <option value="visor">Visor</option>
                                  <option value="superadmin">Super Admin</option>
                                  <option value="tecnico">Técnico</option>
                              </select>
                          {:else}<p class="data-field">{usuario.role || 'N/A'}</p>{/if}
                      </div>
                      <div class="field-group">
                         <div class="label-field">Estado:</div>
                         <p class="data-field"><span class={usuario.isBlocked ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>{usuario.isBlocked ? 'Bloqueado' : 'Activo'}</span> <span class="text-xs text-gray-500 ml-2">(Gestionar desde tabla de usuarios)</span></p>
                      </div>
                      <div class="field-group">
                         <label class="label-field" for="fecha_ingreso">Fecha de Ingreso:</label>
                          {#if editMode}
                            <input class="input-field" id="fecha_ingreso" type="date" bind:value={usuario.fecha_ingreso} disabled={isSaving}>
                            <span class="text-xs text-gray-500 block mt-1">Formato: YYYY-MM-DD</span>
                          {:else}<p class="data-field">{formatDate(usuario.fecha_ingreso)}</p>{/if}
                       </div>
                       <div class="field-group">
                          <div class="label-field">Registrado en:</div>
                          <p class="data-field">{formatDate(usuario.created_at)}</p>
                       </div>

                       <h2 class="text-xl font-medium mb-3 border-b pb-1 pt-4">Detalles Adicionales</h2>
                        <div class="field-group">
                          <label class="label-field" for="curp">CURP:</label>
                          {#if editMode} <input class="input-field" id="curp" type="text" bind:value={usuario.curp} disabled={isSaving}>{:else}<p class="data-field">{usuario.curp || 'N/A'}</p>{/if}
                        </div>
                        <div class="field-group">
                          <label class="label-field" for="rfc">RFC:</label>
                          {#if editMode} <input class="input-field" id="rfc" type="text" bind:value={usuario.rfc} disabled={isSaving}>{:else}<p class="data-field">{usuario.rfc || 'N/A'}</p>{/if}
                        </div>
                        <div class="field-group">
                             <label class="label-field" for="edad">Edad:</label>
                             {#if editMode} <input class="input-field" id="edad" type="number" bind:value={usuario.edad} disabled={isSaving}>{:else}<p class="data-field">{usuario.edad || 'N/A'}</p>{/if}
                         </div>
                        <div class="field-group">
                            <label class="label-field" for="genero">Género:</label>
                             {#if editMode}
                                 
                             <div class="field-group">
                              
                                {#if editMode}
                                    <div class="flex items-center gap-4">
                                        <label class="inline-flex items-center">
                                            <input
                                                type="radio"
                                                class="form-radio"
                                                name="genero" 
                                                value="masculino"
                                                bind:group={usuario.genero}
                                                disabled={isSaving}
                                            />
                                            <span class="ml-2 text-gray-700">Masculino</span>
                                        </label>
                                        <label class="inline-flex items-center">
                                            <input
                                                type="radio"
                                                class="form-radio"
                                                name="genero"
                                                value="femenino"
                                                bind:group={usuario.genero}
                                                disabled={isSaving}
                                            />
                                            <span class="ml-2 text-gray-700">Femenino</span>
                                        </label>
                                        {#if usuario.genero && usuario.genero !== 'masculino' && usuario.genero !== 'femenino'}
                                            <span class="ml-2 text-gray-500 text-sm">Valor actual: {usuario.genero}</span>
                                        {/if}
                                    </div>
                                    {:else}
                                     <p class="data-field">{usuario.genero || 'N/A'}</p>
                                 {/if}
                             </div>
                                 {:else}
                                 <p class="data-field">{usuario.genero || 'N/A'}</p>
                             {/if}
                         </div>
                        <div class="field-group">
                             <label class="label-field" for="estado_civil">Estado Civil:</label>
                             {#if editMode}
                             <div class="field-group">
                               
                                {#if editMode}
                                    <select
                                        class="input-field"
                                        id="estado_civil"
                                        bind:value={usuario.estado_civil}
                                        disabled={isSaving}
                                    >
                                        <option value="">Selecciona</option> 
                                        <option value="soltero">Soltero</option>
                                        <option value="casado">Casado</option>
                                        <option value="divorciado">Divorciado</option>
                                        <option value="viudo">Viudo</option>
                                        <option value="union_libre">Unión Libre</option>
                                        </select>
                                    {:else}
                                     <p class="data-field">{usuario.estado_civil || 'N/A'}</p>
                                 {/if}
                             </div>
                                  {:else}
                                 <p class="data-field">{usuario.estado_civil || 'N/A'}</p>
                             {/if}
                         </div>
                         <div class="field-group">
                            <label class="label-field" for="dias_laborables">Días Laborales:</label>
                            {#if editMode}
                                <div class="space-y-2"> 
                                    {#each editableDiasLaborables as dia, index (index)}
                                        <div class="flex items-center gap-2">
                                            <input
                                                class="input-field flex-grow"
                                                type="text"
                                                placeholder="Día Laborable (ej. Lunes a Viernes de 09:00 a 18:00)"
                                                bind:value={editableDiasLaborables[index]}
                                                disabled={isSaving}
                                            />
                                            {#if editableDiasLaborables.length > 1}
                                                <button
                                                    type="button"
                                                    on:click={() => quitarDiaLaborable(index)}
                                                    disabled={isSaving}
                                                    class="bg-red-500 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                    title="Eliminar horario"
                                                > - </button>
                                            {/if}
                                        </div>
                                    {/each}
                                    <button
                                        type="button"
                                        on:click={agregarDiaLaborable}
                                        disabled={isSaving}
                                        class="bg-green-500 text-white p-2 rounded w-max hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Agregar otro horario"
                                    > Agregar otro horario </button>
                                </div>
                            {:else}
                                {#if usuario.dias_laborables && usuario.dias_laborables.length > 0}
                                    <ul class="data-field-list mt-1 text-gray-900 px-1 space-y-0.5"> 
                                        {#each usuario.dias_laborables as dia}
                                            {#if dia.trim() !== ''} 
                                                <li>{dia.trim()}</li> 
                                            {/if}
                                        {/each}
                                    </ul>
                                {:else}
                                    <p class="data-field text-gray-500">No hay días laborales registrados.</p>
                                {/if}
                                {/if}
                        </div>
                        <div class="field-group">
                             <label class="label-field" for="lugar_ciudad">Lugar Ciudad (Contrato?):</label>
                             {#if editMode} <input class="input-field" id="lugar_ciudad" type="text" bind:value={usuario.lugar_ciudad} disabled={isSaving}>{:else}<p class="data-field">{usuario.lugar_ciudad || 'N/A'}</p>{/if}
                         </div>
                        <div class="field-group">
                             <label class="label-field" for="lugar_fecha">Fecha (Contrato?):</label>
                             {#if editMode}
                               <input class="input-field" id="lugar_fecha" type="date" bind:value={usuario.lugar_fecha} disabled={isSaving}>
                               <span class="text-xs text-gray-500 block mt-1">Formato: YYYY-MM-DD</span>
                             {:else}<p class="data-field">{formatDate(usuario.lugar_fecha)}</p>{/if}
                         </div>
                  </section>

                  <section class="space-y-3">
                      <h2 class="text-xl font-medium mb-3 border-b pb-1">Domicilio</h2>
                      {#if editMode}
                          {#if !usuario.domicilio || !(usuario.domicilio.calle || usuario.domicilio.colonia || usuario.domicilio.cp || usuario.domicilio.estado || usuario.domicilio.numero_ext || usuario.domicilio.numero_int) }
                             <p class="text-sm text-gray-500">No hay domicilio registrado o está incompleto. Rellena los campos para agregarlo/completarlo.</p>
                          {/if}
                          <div class="field-group"> <label class="label-field" for="dom_calle">Calle:</label> <input class="input-field" id="dom_calle" type="text" bind:value={usuario.domicilio.calle} disabled={isSaving}> </div>
                          <div class="field-group"> <label class="label-field" for="dom_num_ext">Número Exterior:</label> <input class="input-field" id="dom_num_ext" type="text" bind:value={usuario.domicilio.numero_ext} disabled={isSaving}> </div>
                          <div class="field-group"> <label class="label-field" for="dom_num_int">Número Interior:</label> <input class="input-field" id="dom_num_int" type="text" bind:value={usuario.domicilio.numero_int} disabled={isSaving}> </div>
                           <div class="field-group"> <label class="label-field" for="dom_colonia">Colonia:</label> <input class="input-field" id="dom_colonia" type="text" bind:value={usuario.domicilio.colonia} disabled={isSaving}> </div>
                          <div class="field-group"> <label class="label-field" for="dom_cp">Código Postal:</label> <input class="input-field" id="dom_cp" type="text" bind:value={usuario.domicilio.cp} disabled={isSaving}> </div>
                          <div class="field-group"> <label class="label-field" for="dom_estado">Estado:</label> <input class="input-field" id="dom_estado" type="text" bind:value={usuario.domicilio.estado} disabled={isSaving}> </div>
                       {:else if usuario.domicilio && (usuario.domicilio.calle || usuario.domicilio.colonia || usuario.domicilio.cp || usuario.domicilio.estado || usuario.domicilio.numero_ext || usuario.domicilio.numero_int)}
                         <p class="data-field">{usuario.domicilio.calle || ''} {usuario.domicilio.numero_ext ? `#${usuario.domicilio.numero_ext}` : ''} {usuario.domicilio.numero_int ? `Int. ${usuario.domicilio.numero_int}` : ''}</p>
                         <p class="data-field">{usuario.domicilio.colonia ? `Col. ${usuario.domicilio.colonia}` : ''}{usuario.domicilio.colonia && usuario.domicilio.cp ? ',' : ''} {usuario.domicilio.cp ? `C.P. ${usuario.domicilio.cp}` : ''}</p>
                         <p class="data-field">{usuario.domicilio.estado || ''}</p>
                       {:else}
                         <p class="data-field text-gray-500">No hay información de domicilio registrada.</p>
                       {/if}

                       <h2 class="text-xl font-medium mb-3 border-b pb-1 pt-4">Documentos</h2>
                       {#if usuario.documents && Object.keys(usuario.documents).length > 0}
                          <ul class="list-none space-y-2">
                           {#if usuario.documents.workerPhoto}<li>
                             <a href={usuario.documents.workerPhoto} target="_blank" rel="noopener noreferrer" class="link-documento"><Image class="icon-doc w-4 h-4"/> Foto Trabajador</a>
                             <img class="object-cover w-24 mt-2 border rounded" src={usuario.documents.workerPhoto} alt="Foto Trabajador" >
                           </li>{/if}
                             {#if usuario.documents.ineFront}<li>
                               <a href={usuario.documents.ineFront} target="_blank" rel="noopener noreferrer" class="link-documento"><Image class="icon-doc w-4 h-4"/> INE (Frente)</a>
                               <img class="object-cover w-32 mt-2 border rounded" src={usuario.documents.ineFront} alt="INE Frente" >
                             </li>{/if}
                             {#if usuario.documents.ineBack}<li>
                               <a href={usuario.documents.ineBack} target="_blank" rel="noopener noreferrer" class="link-documento"><Image class="icon-doc w-4 h-4"/> INE (Reverso)</a>
                               <img class="object-cover w-32 mt-2 border rounded" src={usuario.documents.ineBack} alt="INE Reverso" >
                             </li>{/if}
                             {#if usuario.documents.waiver}<li><a href={usuario.documents.waiver} target="_blank" rel="noopener noreferrer" class="link-documento"><DocumentPdf class="icon-doc w-4 h-4"/>Descargar Carta</a>
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
         {#if !isSaving} <p class="text-center text-red-500">No se pudieron cargar los datos del usuario.</p>
         {/if}
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
  /* .icon-doc styles moved inline or use utility classes */


  /* Clases para botones (Ejemplo, adapta a tu sistema) */
  .btn-primary { --at-apply: flex items-center gap-2 px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed; }
  .btn-secondary { --at-apply: flex items-center gap-2 px-4 py-2 rounded text-white bg-gray-500 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed; }
  .btn-save { --at-apply: flex items-center gap-2 px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed; }


  /* Los estilos para feedback/loader ya usan class: de Svelte */

</style>