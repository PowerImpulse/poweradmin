<button on:click> <slot/> </button>

<style>
	button {
		padding:8px 12px ;
		background-color: var(--br-100);
		border:none;
		outline: none;
		color: var(--br-20);
		font-size: 1rem;
		background-image: linear-gradient(45deg, var(--br-400) 50%, transparent 50%);
		background-position: 100%;
		background-size: 400%;
		transition: background 300ms ease-in-out;
		border-radius: 2px;
		border-spacing: 0;
	}
	button:hover {
		background-position: 0;
		color: var(--br-10);
	}
</style>
