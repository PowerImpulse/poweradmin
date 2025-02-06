<script lang="ts">
     import { time } from '$lib/stores.js';
     const formatter = new Intl.DateTimeFormat('en', {
		hour12: true,
		hour: 'numeric',
		minute: '2-digit',
		//second: '2-digit'
	});

</script>

{formatter.format($time)}

