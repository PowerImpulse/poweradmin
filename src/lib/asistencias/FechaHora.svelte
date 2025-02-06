<script lang="ts">
    export let value: Date | undefined;
  
    let dateStr: string = '-';
  
    $: {
      if (value) {
        dateStr = new Date(value).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
  </script>
  
  <div>{dateStr}</div>