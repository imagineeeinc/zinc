<script>
  import '$lib/css/main.css'

  import { type, hide } from '$lib/componets/statusBar.svelte'
</script>
<svelte:head>
  <title>Zinc</title> 

  <meta name="theme-color" content={$hide ? '#c3ffd7' :$type == 'error' ? 'lightcoral': $type == 'warn' ? 'orange' : $type == 'info' ? 'lightskyblue' : $type == 'success' ? '#8eefc3' : '#c3ffd7'} />
</svelte:head>

<slot />