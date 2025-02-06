<script lang="ts">
    import {page }from "$app/stores"
    export let route: string;
</script>

    <a href={route} class:active={$page.url.pathname == route} class="nav-link" aria-current="page" ><slot/></a>

<style>
    a{
        color:darkgreen;
    }
</style>x