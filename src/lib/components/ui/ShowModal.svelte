<script>
      import AddLarge from "carbon-icons-svelte/lib/AddLarge.svelte";
export let showModal = false
</script>
<button class=" p-8 " on:click={() => (showModal = true)}> <AddLarge size={24} /> </button>