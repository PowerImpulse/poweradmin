<script lang="ts">
   export let id: string;

   export async function load({ params }: { params: { id: string } }) {
      id = params.id;
      return {
         props: {
            id
         }
      };
   }
</script>

<h1>{id}</h1>