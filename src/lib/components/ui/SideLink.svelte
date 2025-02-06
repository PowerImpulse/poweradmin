<script lang="ts">
    import {page }from "$app/stores"
    export let route: string;


</script>

<a href={route} class:active={$page.url.pathname == route} class=" text-white/60 hover:text-white/80 flex ic gap-2 py-2" aria-current="page" on:click >
    <slot/>
</a>

    