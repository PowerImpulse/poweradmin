<script>
   export async function load({ params }) {
      const { id } = params;
      return {
         props: {
            id
         }
      };
   }
</script>

<h1>{id}</h1>