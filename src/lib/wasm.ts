export function isWasmSupported() {
	return (
		typeof WebAssembly === 'object' &&
		typeof WebAssembly.compile === 'function' &&
		typeof WebAssembly.instantiate === 'function' &&
		typeof WebAssembly.Instance === 'function' &&
		typeof WebAssembly.Module === 'function'
	);
}
