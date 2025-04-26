<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import type { AnalyticsSummary } from '$lib/analytics-service';
	import { browser } from '$app/environment';

	let analyticsData: AnalyticsSummary | null = null;
	let loading = true;
	let error = false;
	let chartCanvas: HTMLCanvasElement;
	let chart: any = null;

	// Fetch data on mount
	onMount(async () => {
		try {
			const response = await fetch('/a/analytics');
			if (!response.ok) {
				throw new Error('Failed to fetch analytics data');
			}
			analyticsData = await response.json();
		} catch (err) {
			console.error('Error loading analytics data:', err);
			error = true;
		} finally {
			loading = false;
		}
	});

	// Initialize chart when canvas and data are available
	afterUpdate(async () => {
		if (browser && chartCanvas && analyticsData && !chart) {
			const {
				Chart,
				LineController,
				LineElement,
				PointElement,
				CategoryScale,
				LinearScale,
				Tooltip,
				Legend
			} = await import('chart.js');

			// Register required components
			Chart.register(
				LineController,
				LineElement,
				PointElement,
				CategoryScale,
				LinearScale,
				Tooltip,
				Legend
			);

			const ctx = chartCanvas.getContext('2d');
			if (ctx) {
				// Format dates for display
				const labels = analyticsData.dailyStats.map((stat) => {
					const date = new Date(stat.date);
					return `${date.getMonth() + 1}/${date.getDate()}`;
				});

				// Extract data series
				const totalData = analyticsData.dailyStats.map((stat) => stat.totalSessions);
				const completedData = analyticsData.dailyStats.map((stat) => stat.completedSessions);
				const partialData = analyticsData.dailyStats.map((stat) => stat.partialSessions);

				// Detect dark mode
				const isDarkMode =
					document.documentElement.classList.contains('dark') ||
					document.body.classList.contains('dark') ||
					window.matchMedia('(prefers-color-scheme: dark)').matches;

				// Set chart colors based on theme
				const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
				const textColor = isDarkMode ? '#e5e7eb' : '#4b5563';

				// Create the chart
				chart = new Chart(ctx, {
					type: 'line',
					data: {
						labels,
						datasets: [
							{
								label: 'Total Visits',
								data: totalData,
								borderColor: '#3b82f6',
								backgroundColor: 'rgba(59, 130, 246, 0.1)',
								borderWidth: 2,
								tension: 0.3,
								pointRadius: 0,
								pointHitRadius: 10
							},
							{
								label: 'Completed',
								data: completedData,
								borderColor: '#10b981',
								backgroundColor: 'rgba(16, 185, 129, 0.1)',
								borderWidth: 2,
								tension: 0.3,
								pointRadius: 0,
								pointHitRadius: 10
							},
							{
								label: 'Partial',
								data: partialData,
								borderColor: '#f59e0b',
								backgroundColor: 'rgba(245, 158, 11, 0.1)',
								borderWidth: 2,
								tension: 0.3,
								pointRadius: 0,
								pointHitRadius: 10
							}
						]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						interaction: {
							mode: 'nearest',
							intersect: false
						},
						plugins: {
							legend: {
								position: 'top',
								labels: {
									usePointStyle: true,
									boxWidth: 6,
									color: textColor
								}
							},
							tooltip: {
								mode: 'index',
								intersect: false,
								backgroundColor: isDarkMode ? '#374151' : 'white',
								titleColor: textColor,
								bodyColor: textColor,
								borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
								borderWidth: 1
							}
						},
						scales: {
							x: {
								grid: {
									display: false
								},
								ticks: {
									color: textColor
								}
							},
							y: {
								beginAtZero: true,
								grid: {
									color: gridColor,
									drawBorder: false
								},
								ticks: {
									color: textColor
								}
							}
						}
					}
				});
			}
		}
	});

	// Clean up chart on component unmount
	onMount(() => {
		return () => {
			if (chart) {
				chart.destroy();
			}
		};
	});
</script>

<div class="min-h-screen bg-white p-8 dark:bg-gray-900">
	<div class="mx-auto max-w-6xl">
		<h1 class="mb-8 text-3xl font-bold text-gray-800 dark:text-white">Analytics dashboard</h1>

		{#if loading}
			<div class="flex h-64 items-center justify-center">
				<div
					class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"
				></div>
			</div>
		{:else if error}
			<div
				class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<span class="block sm:inline">Failed to load analytics data. Please try again later.</span>
			</div>
		{:else if analyticsData}
			<!-- Stats Cards -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Total Sessions -->
				<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h2 class="mb-2 text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
						Total visits
					</h2>
					<p class="text-4xl font-bold text-gray-900 dark:text-white">
						{analyticsData.totalSessions}
					</p>
				</div>

				<!-- Completed Sessions -->
				<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h2 class="mb-2 text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
						Completed wizards
					</h2>
					<p class="text-4xl font-bold text-green-600 dark:text-green-400">
						{analyticsData.completedSessions}
					</p>
				</div>

				<!-- Partial Sessions -->
				<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h2 class="mb-2 text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
						Partial completions
					</h2>
					<p class="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
						{analyticsData.partialSessions}
					</p>
				</div>
			</div>

			<!-- Chart -->
			<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-medium text-gray-800 dark:text-white">
					Wizard activity (90 Days)
				</h2>
				<div class="h-96">
					{#if browser && analyticsData}
						<!-- Use plain Chart.js -->
						<canvas id="analyticsChart" bind:this={chartCanvas}></canvas>
					{:else}
						<div class="flex h-full items-center justify-center">
							<div
								class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"
							></div>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Dark mode colors for better visualization */
	:global(.dark) {
		--color-text: #f3f4f6;
		--color-card-bg: #374151;
		--color-border: #4b5563;
	}

	:global(body:not(.dark)) {
		--color-text: #1f2937;
		--color-card-bg: white;
		--color-border: #e5e7eb;
	}
</style>
