<script lang="ts">
	import { collection, addDoc } from 'firebase/firestore';
	import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
	import { db } from '$lib/client';
	import SectionName from '$lib/components/ui/SectionName.svelte';
	import { BarLoader } from 'svelte-loading-spinners';
	import Modal from '$lib/components/ui/Modal.svelte'; // Tu componente Modal
	import TitleArea from '$lib/components/ui/TitleArea.svelte';

	const usersFb = collection(db, 'users');
	const auth = getAuth();

	// --- State Variables ---
	let email = '';
	let username = '';
	let role = '';
	let password = '';
	let error = '';
	let successMessage = '';
	let isLoading = false; // Para controlar el BarLoader
	let showModalState = false; // Variable para controlar el modal (usaremos bind:)

	// ... (resto de variables de estado: lugar_ciudad, nombre_completo, etc. sin cambios)
    let lugar_ciudad = 'Guadalajara';
    let lugar_fecha = '5 de Mayo de 2025';
    let nombre_completo = '';
    let estado_civil: string | null;
    let edad: number | null;
    let genero = 'masculino';
    let rfc = '';
    let curp = '';
    let domicilio_calle = '';
    let domicilio_referencia = '';
	let domicilio_colonia = '';
	let domicilio_cp = '';
    let domicilio_municipio = 'Guadalajara';
	let domicilio_estado = 'Jalisco';
    let fecha_ingreso: string = '';
    let puesto = '1';
    let dias_laborables: string[]= [''];


	// --- Functions ---
	const agregarDiaLaborable = () => {
		dias_laborables = [...dias_laborables, ''];
	};

	const quitarDiaLaborable = (index: number) => {
		if (dias_laborables.length > 1) {
			dias_laborables = dias_laborables.filter((_, i) => i !== index);
		}
	};

	const resetFormFields = () => {
		// Resetear solo los campos necesarios
		email = '';
		username = '';
		role = ''; 
		password = '';
		nombre_completo = '';
		estado_civil = '';
		edad = null;
		genero = '';
		rfc = '';
		curp = '';
		domicilio_calle = '';
		domicilio_referencia = '';
		domicilio_colonia = '';
		domicilio_cp = '';
		domicilio_municipio= '';
		domicilio_estado = '';
		fecha_ingreso = '';
		puesto = '';
		dias_laborables = [''];
		// No reseteamos lugar_ciudad y lugar_fecha si son valores más fijos
	};

	const crearUsuario = async () => {
		// 1. Resetear estado previo y activar loader
		isLoading = true;
		// showModalState = false; // No es necesario resetear aquí si el modal lo hace solo al cerrar
		error = '';
		successMessage = '';

		// 2. Validación básica (puedes añadir más aquí)
		if (email.trim() === "" || username.trim() === "" || role.trim() === "" || password.trim() === "") {
            error = "Los campos de acceso (email, nombre de usuario, rol, contraseña) son obligatorios";
            isLoading = false;
            showModalState = true; // Mostrar modal con el error
            return; // Detener ejecución
        }


		try {
			// 3. Crear usuario en Firebase Authentication
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const user = userCredential.user;

			// 4. Crear usuario en Firestore
			await addDoc(usersFb, {
				email: email,
				username: username,
				role: role,
				isBlocked: false,
				created_at: new Date(),
				uid: user.uid,
				lugar_ciudad: lugar_ciudad,
				lugar_fecha: lugar_fecha,
				nombre_completo: nombre_completo,
				estado_civil: estado_civil,
				edad: edad,
				genero: genero,
				rfc: rfc,
				curp: curp,
				domicilio: {
					calle: domicilio_calle,
					numero_ext: domicilio_referencia,
					numero_int: domicilio_municipio,
					colonia: domicilio_colonia,
					estado: domicilio_estado,
					cp: domicilio_cp
				},
				fecha_ingreso: fecha_ingreso,
				puesto: puesto,
				dias_laborables: dias_laborables.filter((dia) => dia.trim() !== '').map(dia => dia.trim())
			});

			// 5. Éxito: Establecer mensaje y limpiar formulario
			successMessage = '¡Usuario creado exitosamente!';
			resetFormFields(); // Limpiar campos solo en caso de éxito
		} catch (e: any) {
			// 6. Error: Establecer mensaje de error
			console.error('Error al crear usuario:', e); // Loguear error completo
            if (e.code === 'auth/email-already-in-use') {
                error = 'El correo electrónico ya está en uso.';
            } else if (e.code === 'auth/weak-password') {
                error = 'La contraseña es demasiado débil (debe tener al menos 6 caracteres).';
            } else {
                 error = `Error al crear usuario: ${e.message}`;
            }
		} finally {
			
			isLoading = false;
			showModalState = true; 
		}
	};

  
</script>

<!-- Loader: Se muestra solo cuando isLoading es true -->
{#if isLoading}
	<div class="fixed top-0 left-0 w-full z-50">
		<BarLoader color="#2563eb" size="100" unit="%" />
	</div>
{/if}

<!-- Modal: Usamos bind:showModal con la variable de estado -->
<!-- El contenido dentro del <Modal> irá al slot por defecto -->
<Modal bind:showModal={showModalState}>
	{#if error}
		<div class="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
			<h4 class="font-bold">Error</h4>
			<p>{error}</p>
		</div>
	{/if}
	{#if successMessage}
		<div class="p-4 mb-4 bg-green-100 border border-green-400 text-green-700 rounded">
			<h4 class="font-bold">Éxito</h4>
			<p>{successMessage}</p>
		</div>
	{/if}
    <!-- No necesitas añadir un botón de cierre aquí, tu modal ya tiene uno -->
</Modal>

<SectionName Title="Crear Nuevo Usuario">
	<div class="panel">
		<div class="col">
			<!-- Deshabilitar el formulario mientras carga -->
			<fieldset disabled={isLoading} class="crearnuevo grid gap-4 pb-12 ">
				<TitleArea title="Datos de Acceso" class="pt-0" />
				<div class="grid lg:grid-cols-2 gap-6">
					<label>
						Correo electrónico
						<input type="email" placeholder="Correo electrónico" bind:value={email} required />
					</label>
					<label>
						Nombre de usuario
						<input type="text" placeholder="Nombre de usuario" bind:value={username}  />
					</label>
					<label>
						Contraseña
						<input type="password" placeholder="Contraseña" bind:value={password} required />
					</label>
					<label>
						Asignar Rol
						<select bind:value={role} required>
							<option value="tecnico" selected>Técnico</option>
							<option value="contratista">Contratista</option>
							<option value="gerente">Gerente</option>
							<option value="empleado">Empleado</option>
						</select>
					</label>
				</div>

				<TitleArea title="Lugar y Fecha" />

				<label>
					Ciudad
					<input type="text" placeholder="Ciudad" bind:value={lugar_ciudad} />
				</label>
				<label>
					Fecha
					<input type="text" placeholder="Ejem: 5 de Mayo 2025" bind:value={lugar_fecha} />
				</label>

				<TitleArea title="Datos del Trabajador" />
				<div class="grid lg:grid-cols-2 gap-6">
					<input type="text" placeholder="Nombre Completo" bind:value={nombre_completo} />
					<select bind:value={estado_civil} >
						<option value="" disabled selected>Estado Civil</option>
						<option value="soltero">Soltero</option>
						<option value="casado">Casado</option>
						<option value="divorciado">Divorciado</option>
						<option value="viudo">Viudo</option>
						<option value="union_libre">Unión Libre</option>
					</select>
					<input type="number" placeholder="Edad" bind:value={edad} min="18" />
					<div class="flex gap-4">
						<div >
							<label>
								Masculino
								<input type="radio" value="masculino" bind:group={genero} />
							</label>
						</div>
						<div>
							<label>
								Femenino
								<input type="radio" value="femenino" bind:group={genero} />
							</label>
						</div>
					</div>
					<input type="text" placeholder="RFC" bind:value={rfc} />
					<input type="text" placeholder="CURP" bind:value={curp} />
				</div>

				<TitleArea title="Dirección" />

				<div class="grid lg:grid-cols-2 gap-6">
					<label>
						Calle y número
						<input type="text" placeholder="Calle" bind:value={domicilio_calle} />
					</label>
					<label>
						Número Exterior
						<input type="text" placeholder="Número Exterior" bind:value={domicilio_referencia} />
					</label>
					<label>
						Colonia
						<input type="text" placeholder="Colonia" bind:value={domicilio_colonia} />
					</label>
					<label>
						Municipio / Delegación (opcional)
						<input type="text" placeholder="" bind:value={domicilio_municipio} />
					</label>

					<label>
						Código Postal
						<input type="text" placeholder="Código Postal" bind:value={domicilio_cp} />
					</label>
					<label>
						Estado
						<input type="text" placeholder="Escribe un Estado" bind:value={domicilio_estado} />
					</label>
				</div>

				<TitleArea title="Relación Laboral" />
				<label for="date">
					Fecha de ingreso 
					<input type="date" placeholder="Fecha de Ingreso" bind:value={fecha_ingreso} />
				</label>
				<label for="puesto" class="block text-sm font-medium text-gray-700">Puesto / Cargo *</label>
				<select
					id="puesto"
					bind:value={puesto}
					required
					class="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
					disabled={isLoading}
				>
					<option value="Técnico de servicio AA" selected>Técnico de servicio AA</option>
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

				<TitleArea title="Días Laborales" />
				{#each dias_laborables as dia, index (index)}
					<div class="flex items-center gap-2">
						<input
							type="text"
							placeholder="Día Laborable (ej. Lunes a Viernes de 09:00 a 18:00)"
							bind:value={dias_laborables[index]}
						/>
						{#if dias_laborables.length > 1}
							<button
								type="button"
								on:click={() => quitarDiaLaborable(index)}
								class="bg-red-500 text-white p-2 rounded hover:bg-red-700"
							>-</button>
						{/if}
					</div>
				{/each}
				<button
					type="button"
					on:click={agregarDiaLaborable}
					class="bg-green-500 text-white p-2 rounded w-max hover:bg-green-700"
				>Agregar otro horario</button>

				<div class="pt-10">
					<button
						type="button"
						on:click={crearUsuario}
						disabled={isLoading}
						class="p-4 bg-blue-600 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed border-1 text-white rounded"
					>
						{#if isLoading}
							Creando...
						{:else}
							Crear Usuario
						{/if}
					</button>
				</div>
			</fieldset>
			<!-- Fin del fieldset -->
		</div>
	</div>
</SectionName>

<style>
	input,
	select {
		--at-apply: py-1 px-2 border-2 border-zinc-200 text-base rounded focus:border-brand focus:ring-1 focus:ring-blue-500 outline-none;
	}
	fieldset:disabled input,
	fieldset:disabled select,
	fieldset:disabled button {
		--at-apply: bg-gray-100 cursor-not-allowed opacity-70;
	}

	label, label select, input{
	  --at-apply: block w-full  ;	
	}
	label{
		--at-apply: text-sm  ;	
	}
</style>