<script lang="ts">
    import { type PagingData } from "@mediakular/gridcraft";
    export let paging: PagingData; 
    let itemsPerPage = 10;

    function nextPage() {
        paging.currentPage += 1;
    }
    function prevPage() {
        paging.currentPage -= 1;
    }
    function handleItemsPerPageChange() {
        paging.itemsPerPage = itemsPerPage;
    }


</script>

<div>
    <select bind:value={itemsPerPage} on:change={handleItemsPerPageChange}>
        {#each paging.itemsPerPageOptions as option (option)}
            <option value="{option}" selected={option == paging.itemsPerPage}>{option}</option>
        {/each}
    </select>
    Page <span>{paging.currentPage}</span> of <span>{paging.totalPages}</span>
    <button on:click={prevPage} type="button" disabled={paging.currentPage == 1 ? true : false}>
        Previous
    </button>
    <button on:click={nextPage} type="button" disabled={paging.currentPage < paging.totalPages ? false : true}>
        Next
    </button>
</div>