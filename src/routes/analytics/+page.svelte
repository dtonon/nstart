<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import type { AnalyticsSummary } from '$lib/analytics-service';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	export let data: PageData;
	
	let analyticsData: AnalyticsSummary | null = data.analyticsData || null;
	let error = !!data.error;
	let chartCanvas: HTMLCanvasElement;
	let funnelCanvas: HTMLCanvasElement;
	let chart: any = null;
	let funnelChart: any = null;

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
				const gridColor = 'oklch(37.4% 0.01 67.558)'; // neutral-500
				const textColor = 'oklch(86.9% 0.005 56.366)'; // neutral-300

				// Create the chart
				chart = new Chart(ctx, {
					type: 'line',
					data: {
						labels,
						datasets: [
							{
								label: 'Total Visits',
								data: totalData,
								borderColor: 'oklch(97% 0 0)',
								backgroundColor: 'oklch(97% 0 0)', // neutral-100
								borderWidth: 2,
								tension: 0.3,
								pointRadius: 0,
								pointHitRadius: 10
							},
							{
								label: 'Started Wizard',
								data: partialData.map((partial, i) => partial + completedData[i]), // Sum of partial + completed
								borderColor: 'oklch(82.8% 0.189 84.429)', // amber-400
								backgroundColor: 'oklch(82.8% 0.189 84.429)',
								borderWidth: 2,
								tension: 0.3,
								pointRadius: 0,
								pointHitRadius: 10
							},
							{
								label: 'Completed Wizard',
								data: completedData,
								borderColor: 'oklch(69.6% 0.17 162.48)', // emerald-500
								backgroundColor: 'oklch(69.6% 0.17 162.48)',
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
									color: textColor,
									pointStyle: 'circle',
									pointStyleWidth: 16,
									padding: 20
								}
							},
							tooltip: {
								mode: 'index',
								intersect: false,
								backgroundColor: 'oklch(43.9% 0 0)',
								titleColor: textColor,
								bodyColor: textColor,
								borderColor: 'oklch(43.9% 0 0)',
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

	// Initialize funnel chart when canvas and data are available
	afterUpdate(async () => {
		if (browser && funnelCanvas && analyticsData && !funnelChart && analyticsData.funnelData) {
			const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } =
				await import('chart.js');

			// Register required components if not already registered
			Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

			// Sort steps in the correct wizard order
			const stepOrder = {
				homepage: 0,
				yourself: 1,
				download: 2,
				email: 3,
				bunker: 4,
				follow: 5
			};

			const sortedFunnelData = [...analyticsData.funnelData].sort(
				(a, b) =>
					stepOrder[a.step_name as keyof typeof stepOrder] -
					stepOrder[b.step_name as keyof typeof stepOrder]
			);

			// Format step names for display (capitalize first letter)
			const labels = sortedFunnelData.map(
				(step) => step.step_name.charAt(0).toUpperCase() + step.step_name.slice(1)
			);

			// Extract data series
			const completedData = sortedFunnelData.map((step) => step.completed);
			const skippedData = sortedFunnelData.map((step) => step.skipped);
			// Calculate abandoned users (total - completed - skipped)
			const abandonedData = sortedFunnelData.map(
				(step) => step.total - step.completed - step.skipped
			);

			// Detect dark mode
			const isDarkMode =
				document.documentElement.classList.contains('dark') ||
				document.body.classList.contains('dark') ||
				window.matchMedia('(prefers-color-scheme: dark)').matches;

			// Set chart colors based on theme
			const gridColor = 'oklch(37.4% 0.01 67.558)'; // neutral-500
			const textColor = 'oklch(86.9% 0.005 56.366)'; // neutral-300

			const ctx = funnelCanvas.getContext('2d');
			if (ctx) {
				// Create the chart
				funnelChart = new Chart(ctx, {
					type: 'bar',
					data: {
						labels,
						datasets: [
							{
								label: 'Completed',
								data: completedData,
								backgroundColor: 'oklch(69.6% 0.17 162.48)', // emerald-500
								borderColor: 'oklch(69.6% 0.17 162.48)',
								borderWidth: 2
							},
							{
								label: 'Skipped',
								data: skippedData,
								backgroundColor: 'oklch(84.5% 0.143 164.978)', // emerald-200
								borderColor: 'oklch(84.5% 0.143 164.978)',
								borderWidth: 2
							},
							{
								label: 'Abandoned',
								data: abandonedData,
								backgroundColor: 'oklch(70.4% 0.191 22.216)', // slate-400, grey
								borderColor: 'oklch(70.4% 0.191 22.216)',
								borderWidth: 2
							}
						]
					},
					options: {
						indexAxis: 'y', // This makes it a horizontal bar chart
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								position: 'top',
								labels: {
									usePointStyle: true,
									boxWidth: 6,
									color: textColor,
									pointStyle: 'circle',
									pointStyleWidth: 16,
									padding: 20
								}
							},
							tooltip: {
								mode: 'index',
								intersect: true,
								backgroundColor: 'oklch(43.9% 0 0)',
								titleColor: textColor,
								bodyColor: textColor,
								borderColor: 'oklch(43.9% 0 0)',
								borderWidth: 1,
								callbacks: {
									// Add total and percentage information
									title: function (tooltipItems) {
										const stepIndex = tooltipItems[0].dataIndex;
										const stepName =
											sortedFunnelData[stepIndex].step_name.charAt(0).toUpperCase() +
											sortedFunnelData[stepIndex].step_name.slice(1);
										const totalUsers = sortedFunnelData[stepIndex].total;
										return [`${stepName} (Total: ${totalUsers} users)`];
									},
									label: function (context) {
										const stepIndex = context.dataIndex;
										const datasetIndex = context.datasetIndex;
										const datasetLabel = context.dataset.label || '';
										const value = context.parsed.x;

										const totalForStep = sortedFunnelData[stepIndex].total;
										const percentage =
											totalForStep > 0 ? ((value / totalForStep) * 100).toFixed(1) : '0';

										return `${datasetLabel}: ${value} (${percentage}%)`;
									}
								}
							}
						},
						scales: {
							x: {
								stacked: true,
								beginAtZero: true,
								grid: {
									color: gridColor,
									drawBorder: false
								},
								ticks: {
									color: textColor
								}
							},
							y: {
								stacked: true,
								grid: {
									display: false
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

	// Clean up charts on component unmount
	onMount(() => {
		return () => {
			if (chart) {
				chart.destroy();
			}
			if (funnelChart) {
				funnelChart.destroy();
			}
		};
	});
</script>

<div class="min-h-screen bg-neutral-900 p-8 pb-32">
	<div class="mx-auto max-w-6xl">
		<h1 class="mb-8 text-3xl font-bold text-white">Nstart Analytics</h1>

		{#if error}
			<div
				class="relative rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700"
				role="alert"
			>
				<span class="block sm:inline">Failed to load analytics data. Please try again later.</span>
			</div>
		{:else if analyticsData}
			<!-- Stats Cards - First Row -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Total Sessions -->
				<div class="rounded-lg bg-neutral-800 p-6">
					<h2 class="mb-2 text-sm font-medium uppercase text-neutral-300">Total visits</h2>
					<p class="text-4xl font-bold text-white">
						{analyticsData.totalSessions}
					</p>
				</div>

				<!-- Started wizards -->
				<div class="rounded-lg bg-neutral-800 p-6">
					<h2 class="mb-2 text-sm font-medium uppercase text-neutral-300">Started wizards</h2>
					<p class="text-4xl font-bold text-amber-400">
						{analyticsData.partialSessions + analyticsData.completedSessions}
					</p>
				</div>

				<!-- Completed Sessions -->
				<div class="rounded-lg bg-neutral-800 p-6">
					<h2 class="mb-2 text-sm font-medium uppercase text-neutral-300">Completed wizards</h2>
					<p class="text-4xl font-bold text-emerald-500">
						{analyticsData.completedSessions}
					</p>
				</div>
			</div>

			<!-- Stats Cards - Second Row (Step Completions) -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Email Step Completed -->
				<div class="rounded-lg bg-neutral-800 p-6">
					<h2 class="mb-2 text-sm font-medium uppercase text-neutral-300">Backup email sent</h2>
					<p class="text-4xl font-bold text-blue-400">
						{analyticsData.emailCompletedSessions}
					</p>
					<p class="mt-1 text-sm text-neutral-400">
						in {analyticsData.completedSessions > 0
							? (
									(analyticsData.emailCompletedSessions / analyticsData.completedSessions) *
									100
								).toFixed(1)
							: 0}% of completed wizards
					</p>
				</div>

				<!-- Bunker Step Completed -->
				<div class="rounded-lg bg-neutral-800 p-6">
					<h2 class="mb-2 text-sm font-medium uppercase text-neutral-300">Bunker created</h2>
					<p class="text-4xl font-bold text-blue-400">
						{analyticsData.bunkerCompletedSessions}
					</p>
					<p class="mt-1 text-sm text-neutral-400">
						in {analyticsData.completedSessions > 0
							? (
									(analyticsData.bunkerCompletedSessions / analyticsData.completedSessions) *
									100
								).toFixed(1)
							: 0}% of completed wizards
					</p>
				</div>

				<!-- Follow Step Completed -->
				<div class="rounded-lg bg-neutral-800 p-6">
					<h2 class="mb-2 text-sm font-medium uppercase text-neutral-300">Followed someone</h2>
					<p class="text-4xl font-bold text-blue-400">
						{analyticsData.followCompletedSessions}
					</p>
					<p class="mt-1 text-sm text-neutral-400">
						in {analyticsData.completedSessions > 0
							? (
									(analyticsData.followCompletedSessions / analyticsData.completedSessions) *
									100
								).toFixed(1)
							: 0}% of completed wizards
					</p>
				</div>
			</div>

			<!-- Activity Chart -->
			<div class="mb-8 rounded-lg bg-neutral-800 p-6">
				<h2 class="text-lg font-medium text-white">Visits and wizard sessions</h2>
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

			<!-- Funnel Visualization -->
			<div class="mb-8 rounded-lg bg-neutral-800 p-6">
				<h2 class="mb-4 text-lg font-medium text-white">Wizard funnel analysis</h2>
				<div class="h-96">
					{#if browser && analyticsData && analyticsData.funnelData}
						<canvas id="funnelChart" bind:this={funnelCanvas}></canvas>
					{:else}
						<div class="flex h-full items-center justify-center">
							<div
								class="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"
							></div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Top Sources Table -->
			<div class="rounded-lg bg-neutral-800">
				<h2 class="mb-4 p-6 text-lg font-medium text-white">Top 30 sources</h2>
				{#if analyticsData.topSources && analyticsData.topSources.length > 0}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-neutral-700">
							<thead class="bg-neutral-900">
								<tr>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400"
									>
										Source
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400"
									>
										Sessions
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400"
									>
										Completed
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-neutral-700 bg-neutral-800">
								{#each analyticsData.topSources as source, i}
									<tr class={i % 2 === 0 ? 'bg-neutral-800' : 'bg-neutral-700'}>
										<td
											class="max-w-lg overflow-hidden text-ellipsis whitespace-nowrap px-6 py-4 text-sm font-medium text-neutral-100"
										>
											{source.source}
										</td>
										<td class="whitespace-nowrap px-6 py-4 text-sm text-neutral-100">
											{source.sessions}
											<span class="text-xs text-neutral-300">
												({analyticsData.totalSessions > 0
													? ((source.sessions / analyticsData.totalSessions) * 100).toFixed(1)
													: 0}%)
											</span>
										</td>
										<td class="whitespace-nowrap px-6 py-4 text-sm text-emerald-500">
											{source.completed}
											<span class="text-xs text-neutral-300">
												({source.sessions > 0
													? ((source.completed / source.sessions) * 100).toFixed(1)
													: 0}%)
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-neutral-400">No source data available.</p>
				{/if}
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