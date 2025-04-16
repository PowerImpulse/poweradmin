<script lang="ts">
	import { collection, addDoc, Timestamp } from 'firebase/firestore';
	import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
	import { dbUsers } from '$lib/client';
	import SectionName from '$lib/components/ui/SectionName.svelte';
    import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const usersFb = collection(dbUsers, 'users');
	const auth = getAuth();

	// --- State Variables ---
	let email = 'Jean Luis ';
	let username = '';
	let role = 'Técnico';
	let password = '';
	let error = '';
    let successMessage = '';
	let isLoading = false;

	// Lugar y Fecha
	let lugar_ciudad = 'Guadalajara';
	let lugar_estado = 'Jalisco';

	// Datos del Trabajador
	let nombre_completo = '';
	let estado_civil = 'soltero';
	let edad: number | null = null;
	let sexo = 'masculino';
	let rfc = '';
	let curp = '';
	let domicilio_calle = '';
	let domicilio_numero_ext = '';
	let domicilio_numero_int = '';
	let domicilio_colonia = '';
	let domicilio_cp = '';

	// Relación laboral
	let fecha_ingreso: string = '';
	let puesto = '1';
	let horario_trabajo = ''; // Horario general (si aún lo necesitas)

	// **NUEVO: Días Laborables Dinámicos**
	let dias_laborables: string[] = ['']; // Inicializa con un campo vacío

	// --- Functions ---

    // **NUEVO: Funciones para manejar días laborables**
    const agregarDiaLaborable = () => {
        dias_laborables = [...dias_laborables, '']; // Añade un string vacío al array
    };

    const quitarDiaLaborable = (index: number) => {
        if (dias_laborables.length > 1) { // Asegura que siempre quede al menos uno
            dias_laborables = dias_laborables.filter((_, i) => i !== index);
        }
    };

	const crearUsuario = async () => {
		isLoading = true;
		error = '';
        successMessage = '';

		// **VALIDACIÓN ACTUALIZADA** para días laborables
        const diasLaborablesValidos = dias_laborables.every(dia => dia.trim() !== ''); // Todos deben tener contenido
        if (!diasLaborablesValidos) {
            error = 'Todos los campos de Días Laborables deben contener información.';
			isLoading = false;
			return;
        }

		// Validación básica (resto de campos)
		if (
			!email.trim() || !password.trim() || !nombre_completo.trim() ||
            !estado_civil.trim() || edad === null || edad <= 0 || !sexo.trim() ||
            !rfc.trim() || !curp.trim() || !domicilio_calle.trim() ||
            !domicilio_numero_ext.trim() || !domicilio_colonia.trim() || !domicilio_cp.trim() ||
            !fecha_ingreso || !puesto.trim() || !horario_trabajo.trim() || // Mantenemos horario_trabajo general por si acaso
            !lugar_ciudad.trim() || !lugar_estado.trim()
		) {
			error = 'Todos los campos marcados con * son obligatorios (excepto Domicilio Interior).';
			isLoading = false;
			return;
		}
        // ... (resto de validaciones específicas: password, rfc, curp, cp) ...
        if (password.length < 6) {
            error = "La contraseña debe tener al menos 6 caracteres."; isLoading = false; return;
        }
        if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(rfc)) {
             error = "El formato del RFC no es válido."; isLoading = false; return;
        }
         if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$/.test(curp)) {
             error = "El formato del CURP no es válido."; isLoading = false; return;
        }
        if (!/^\d{5}$/.test(domicilio_cp)) {
            error = "El Código Postal debe contener 5 dígitos."; isLoading = false; return;
        }


		try {
			// 1. Crear usuario en Auth
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

            // 2. Actualizar perfil Auth
            await updateProfile(user, { displayName: nombre_completo });

			// 3. Preparar datos Firestore
			const userData = {
				// Auth/App info
				uid: user.uid, email: email,
				username: username || nombre_completo.split(' ')[0] || email,
				role: role, isBlocked: false,
				created_at: Timestamp.fromDate(new Date()),

				// Lugar registro
				lugar_registro: { ciudad: lugar_ciudad, estado: lugar_estado, fecha: Timestamp.fromDate(new Date()) },

				// Datos Trabajador
				nombre_completo: nombre_completo, estado_civil: estado_civil, edad: edad, sexo: sexo,
				rfc: rfc.toUpperCase(), curp: curp.toUpperCase(),
				domicilio: {
					calle: domicilio_calle, numero_ext: domicilio_numero_ext, numero_int: domicilio_numero_int || null,
					colonia: domicilio_colonia, codigo_postal: domicilio_cp, ciudad: 'Guadalajara', estado: 'Jalisco'
				},

				// Relación laboral
				fecha_ingreso: Timestamp.fromDate(new Date(fecha_ingreso + 'T00:00:00')),
				puesto: puesto,
				horario_trabajo_general: horario_trabajo, // Guardamos el campo general si aún lo quieres

				// **GUARDANDO DIAS LABORABLES COMO ARRAY**
				dias_laborables: dias_laborables.filter(dia => dia.trim()) // Guardamos el array, filtrando vacíos por si acaso
			};

			// 4. Crear documento en Firestore
			await addDoc(usersFb, userData);

            successMessage = "¡Usuario creado con éxito!";
			error = '';

			// 5. Limpiar formulario
			resetFormFields();

		} catch (e: any) { // ... (Manejo de errores igual que antes) ...
            console.error("Error detallado:", e);
			if (e.code === 'auth/email-already-in-use') { error = 'Error: El correo electrónico ya está en uso.'; }
            else if (e.code === 'auth/weak-password') { error = 'Error: La contraseña es demasiado débil.'; }
            else if (e.code === 'auth/invalid-email') { error = 'Error: El formato del correo no es válido.'; }
            else { error = `Error al crear usuario: ${e.message}`; }
		} finally {
			isLoading = false;
		}
	};

	const resetFormFields = () => { // **ACTUALIZADO**
		email = ''; username = ''; role = 'Técnico'; password = '';
		lugar_ciudad = 'Guadalajara'; lugar_estado = 'Jalisco';
		nombre_completo = ''; estado_civil = 'soltero'; edad = null; sexo = 'masculino';
		rfc = ''; curp = '';
		domicilio_calle = ''; domicilio_numero_ext = ''; domicilio_numero_int = '';
		domicilio_colonia = ''; domicilio_cp = '';
		fecha_ingreso = ''; puesto = '1';
        horario_trabajo = ''; // Resetear horario general
		dias_laborables = ['']; // Resetear a un solo campo vacío
	};

    onMount(() => { if (!browser) { console.warn("Formulario renderizando en servidor."); } });

</script>

<SectionName Title="Crear Nuevo Usuario">
	<div class="panel p-4 md:p-6 bg-white shadow-md rounded-lg">
        {#if error}
            <p class="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">{error}</p>
        {/if}
        {#if successMessage}
             <p class="mb-4 p-3 bg-green-100 text-green-700 border border-green-300 rounded">{successMessage}</p>
        {/if}

		<form on:submit|preventDefault={crearUsuario} class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

            <!-- ... (Campos anteriores: Datos Acceso, Datos Trabajador, Domicilio) ... -->
             <!-- Columna 1 -->
            <div class="md:col-span-2"> <h3 class="text-lg font-semibold mb-2 border-b pb-1">Datos de Acceso y Rol</h3></div>
            <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Correo electrónico *</label>
			    <input type="email" id="email" placeholder="ejemplo@correo.com" bind:value={email} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Contraseña *</label>
                <input type="password" id="password" placeholder="Mínimo 6 caracteres" bind:value={password} required minlength="6" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
             <div>
                <label for="username" class="block text-sm font-medium text-gray-700">Nombre de usuario (login)</label>
			    <input type="text" id="username" placeholder="Opcional, ej: jperez" bind:value={username} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
             <div>
                <label for="role" class="block text-sm font-medium text-gray-700">Rol en la Aplicación *</label>
			    <select id="role" bind:value={role} required class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}>
                    <option value="Admin">Admin</option>
                    <option value="Técnico">Técnico</option>
                </select>
             </div>

            <div class="md:col-span-2 mt-4"> <h3 class="text-lg font-semibold mb-2 border-b pb-1">Datos del Trabajador</h3></div>
			<div>
                <label for="nombre_completo" class="block text-sm font-medium text-gray-700">Nombre completo *</label>
			    <input type="text" id="nombre_completo" placeholder="Nombre(s) ApellidoP ApellidoM" bind:value={nombre_completo} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                 <label for="edad" class="block text-sm font-medium text-gray-700">Edad *</label>
                <input type="number" id="edad" placeholder="Ej: 30" bind:value={edad} required min="18" max="99" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                <label for="estado_civil" class="block text-sm font-medium text-gray-700">Estado civil *</label>
                <select id="estado_civil" bind:value={estado_civil} required class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}>
                    <option value="soltero">Soltero(a)</option> <option value="casado">Casado(a)</option> <option value="divorciado">Divorciado(a)</option>
                    <option value="viudo">Viudo(a)</option> <option value="union_libre">Unión Libre</option> <option value="otro">Otro</option>
                </select>
            </div>
            <div>
                 <label for="sexo" class="block text-sm font-medium text-gray-700">Sexo *</label>
                <select id="sexo" bind:value={sexo} required class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}>
                    <option value="masculino">Masculino</option> <option value="femenino">Femenino</option>
                </select>
            </div>
             <div>
                 <label for="rfc" class="block text-sm font-medium text-gray-700">RFC *</label>
                <input type="text" id="rfc" placeholder="Ej: PERR900101XXX" bind:value={rfc} required pattern="^[A-ZÑ&]{3,4}\d{6}(?:[A-Z\d]{3})?$" title="RFC válido (10 o 13 caracteres)" style="text-transform:uppercase;" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                 <label for="curp" class="block text-sm font-medium text-gray-700">CURP *</label>
                <input type="text" id="curp" placeholder="Ej: PERR900101HXX..." bind:value={curp} required pattern="^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]\d$" title="CURP válido (18 caracteres)" style="text-transform:uppercase;" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>

             <div class="md:col-span-2 mt-2"> <h4 class="text-md font-semibold mb-1">Domicilio (Guadalajara, Jalisco)</h4></div>
             <div class="md:col-span-2">
                 <label for="domicilio_calle" class="block text-sm font-medium text-gray-700">Calle *</label>
                <input type="text" id="domicilio_calle" placeholder="Ej: Av. Siempre Viva" bind:value={domicilio_calle} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
             </div>
            <div>
                <label for="domicilio_numero_ext" class="block text-sm font-medium text-gray-700">Número Exterior *</label>
                <input type="text" id="domicilio_numero_ext" placeholder="Ej: 123" bind:value={domicilio_numero_ext} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                <label for="domicilio_numero_int" class="block text-sm font-medium text-gray-700">Número Interior</label>
                <input type="text" id="domicilio_numero_int" placeholder="Opcional (Ej: Depto 4B)" bind:value={domicilio_numero_int} class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
             <div>
                <label for="domicilio_colonia" class="block text-sm font-medium text-gray-700">Colonia *</label>
                <input type="text" id="domicilio_colonia" placeholder="Ej: Chapultepec" bind:value={domicilio_colonia} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                <label for="domicilio_cp" class="block text-sm font-medium text-gray-700">Código Postal *</label>
                <input type="text" id="domicilio_cp" placeholder="Ej: 44100" bind:value={domicilio_cp} required pattern="\d{5}" title="5 dígitos numéricos" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>


            <!-- Relación Laboral -->
            <div class="md:col-span-2 mt-4"> <h3 class="text-lg font-semibold mb-2 border-b pb-1">Relación Laboral</h3></div>
            <div>
                <label for="fecha_ingreso" class="block text-sm font-medium text-gray-700">Fecha de ingreso *</label>
			    <input type="date" id="fecha_ingreso" bind:value={fecha_ingreso} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                <label for="puesto" class="block text-sm font-medium text-gray-700">Puesto / Cargo *</label>
                 <select id="puesto" bind:value={puesto} required class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}>
                    <option value="1">Técnico de servicio AA</option> <option value="2">Técnico de servicio UPS</option> <option value="3">Coordinador de servicio AA</option>
                    <option value="4">Coordinador de servicio UPS</option> <option value="5">Almacenista/ayudante general</option> <option value="6">Logística y atención al cliente</option>
                    <option value="7">Ventas</option> <option value="8">Coordinador de ventas</option> <option value="9">Técnico servicio plantas emergencia</option>
                    <option value="10">Coordinador servicio plantas emergencia</option> <option value="11">Recepción</option> <option value="12">Recursos humanos</option>
                    <option value="13">Instalador</option> <option value="14">Asistente administrativo</option>
                </select>
            </div>

            <!-- **NUEVO: Campo de Horario General (Opcional)** -->
             <div class="md:col-span-2">
                <label for="horario_trabajo" class="block text-sm font-medium text-gray-700">Horario General *</label>
                <input type="text" id="horario_trabajo" placeholder="Ej: Lunes a Viernes 9:00 a 18:00" bind:value={horario_trabajo} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>

            <!-- **NUEVO: Sección Dinámica Días Laborables** -->
            <div class="md:col-span-2 mt-2">
                 <label id="text-dias" class="block text-sm font-medium text-gray-700 mb-1">Días/Horarios Específicos *</label>
                 {#each dias_laborables as dia, index (index)}
                    <div class="flex items-center gap-2 mb-2">
                        <input
                            type="text-dias"
                            placeholder="Ej: Lunes 9:00-14:00, Sábado guardia"
                            bind:value={dias_laborables[index]}
                            required
                            class="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            disabled={isLoading}
                        />
                        {#if index > 0} <!-- Solo mostrar botón quitar si no es el primero -->
                            <button
                                type="button"
                                on:click={() => quitarDiaLaborable(index)}
                                class="px-2 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded border border-red-300 text-sm"
                                title="Quitar este horario"
                                disabled={isLoading}
                            >
                                Quitar
                            </button>
                        {/if}
                    </div>
                 {/each}
                 <button
                    type="button"
                    on:click={agregarDiaLaborable}
                    class="mt-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded border border-green-300 text-sm"
                    disabled={isLoading}
                 >
                    + Agregar Día/Horario
                 </button>
            </div>


             <!-- Lugar de Registro -->
             <div class="md:col-span-2 mt-4"> <h3 class="text-lg font-semibold mb-2 border-b pb-1">Lugar de Registro</h3></div>
            <div>
                <label for="lugar_ciudad" class="block text-sm font-medium text-gray-700">Ciudad *</label>
                <input type="text" id="lugar_ciudad" placeholder="Ciudad" bind:value={lugar_ciudad} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>
            <div>
                <label for="lugar_estado" class="block text-sm font-medium text-gray-700">Estado *</label>
                <input type="text" id="lugar_estado" placeholder="Estado" bind:value={lugar_estado} required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={isLoading}/>
            </div>


            <!-- Botón de envío -->
			<div class="md:col-span-2 mt-6 flex justify-end">
				<button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50" disabled={isLoading}>
                    {#if isLoading} Creando... {:else} Agregar Usuario {/if}
                </button>
			</div>
		</form>
	</div>
</SectionName>
