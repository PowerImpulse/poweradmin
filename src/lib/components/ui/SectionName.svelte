<script>
    export let Title = "";
</script>

<section class="bg-slate-2 class={$$props.class}">
    <div class="container py-8 ">
        <div class="flex icb"> 
            <h2 class="text-8"> {Title} </h2>
            <slot name="sideactions" />
        </div>
       
        <slot name="titlebar" />
    </div>
</section>
<section class="bg-slate-1" >
    <div class="container py-8">
       <slot />
    </div>
</section>