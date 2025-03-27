<script lang="ts">
    export let data: { marca: string; modelo: string; serie: string };
</script>

<div class="equipo-info">
    <div class="font-bold">{data.marca} {data.modelo}</div>
    <div class="text-sm text-gray-500">Serie: {data.serie}</div>
</div>