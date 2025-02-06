<script>
	import { base } from '$app/paths';

</script>

<svelte:head>
	<title>Error 404</title>
</svelte:head>

<div>

		<span>404</span>
		<h1>Pagina no encontrada!</h1>
		<a href="{base}/">Regresar a Inicio</a>
	
</div>

<style>
	div{
		display: flex;
		flex-direction: column;
		height: 100vh;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	
	h1 {
		color: var(--svelteui-colors-primary);
	}
	span{
		font-size: 100px;
	}
	@media (max-width: 900px) {
		span{
		font-size: 50px;
	}
	}
</style>
