<script lang="ts">
	import { Switch as SwitchPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		size = "default",
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> & {
		size?: "sm" | "default";
	} = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	data-size={size}
	class={cn(
			"data-checked:border-primary/70 data-checked:bg-primary/15 data-unchecked:border-input data-unchecked:bg-input/20 hover:data-unchecked:border-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 shrink-0 rounded-none border px-[3px] focus-visible:ring-1 aria-invalid:ring-1 group-has-[:focus-visible]/field-label:ring-0 data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7 peer group/switch relative inline-flex items-center transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class={cn(
			"data-unchecked:bg-muted-foreground data-checked:bg-primary data-checked:shadow-[0_0_6px_var(--primary)] rounded-none group-data-[size=default]/switch:size-3 group-data-[size=sm]/switch:size-2.5 group-data-[size=default]/switch:data-checked:translate-x-4 group-data-[size=sm]/switch:data-checked:translate-x-2.5 data-unchecked:translate-x-0 pointer-events-none block ring-0 transition-all",
			"rtl:group-data-[size=default]/switch:data-checked:-translate-x-4 rtl:group-data-[size=sm]/switch:data-checked:-translate-x-2.5"
		)}
	/>
</SwitchPrimitive.Root>
