<script lang="ts">
    import {page }from "$app/stores"
    export let route: string;
</script>

<a href={route} class:active={$page.url.pathname == route} 
    class="sidelink" 
    aria-current="page" on:click ><slot/>
</a>

    