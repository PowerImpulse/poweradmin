<script>
    let buttonProps = {
	class:[$$restProps.class]
	}
</script>

<button 
on:click 
on:mouseover
on:focus
on:mouseenter
on:mouseleave
class={$$props.class}
 > 
    <slot/> 
</button>

<style>
	button {
		width: 64px;
        height: 64px;
		background-color: var(--br-100);
		border-color: var(--br-100);
		color: var(--br-20);
		font-size: 1rem;
		background-image: linear-gradient(45deg, var(--br-400) 50%, transparent 50%);
		background-position: 100%;
		background-size: 400%;
		transition: background 300ms ease-in-out;
        border: none;
        outline:none;
	}
	button:hover {
		background-position: 0;
		color: var(--br-10);
	}
</style>
