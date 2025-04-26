<script lang="ts">
	import { onMount, afterUpdate } from 'svelte';
	import type { AnalyticsSummary, FunnelStep } from '$lib/analytics-service';
	import { browser } from '$app/environment';

	let analyticsData: AnalyticsSummary | null = null;
	let loading = true;
	let error = false;
	let chartCanvas: HTMLCanvasElement;
	let funnelCanvas: HTMLCanvasElement;
	let chart: any = null;
	let funnelChart: any = null;

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

			// Detect dark mode
			const isDarkMode =
				document.documentElement.classList.contains('dark') ||
				document.body.classList.contains('dark') ||
				window.matchMedia('(prefers-color-scheme: dark)').matches;

			// Set chart colors based on theme
			const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
			const textColor = isDarkMode ? '#e5e7eb' : '#4b5563';

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
								backgroundColor: '#10b981', // green
								borderColor: '#059669',
								borderWidth: 1
							},
							{
								label: 'Skipped',
								data: skippedData,
								backgroundColor: '#f59e0b', // amber
								borderColor: '#d97706',
								borderWidth: 1
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
									color: textColor
								}
							},
							tooltip: {
								mode: 'index',
								intersect: true,
								backgroundColor: isDarkMode ? '#374151' : 'white',
								titleColor: textColor,
								bodyColor: textColor,
								borderColor: isDarkMode ? '#4b5563' : '#e5e7eb',
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
			<!-- Stats Cards - First Row -->
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

			<!-- Stats Cards - Second Row (Step Completions) -->
			<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Email Step Completed -->
				<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h2 class="mb-2 text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
						Email step completed
					</h2>
					<p class="text-4xl font-bold text-blue-600 dark:text-blue-400">
						{analyticsData.emailCompletedSessions}
					</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{analyticsData.completedSessions > 0
							? (
									(analyticsData.emailCompletedSessions / analyticsData.completedSessions) *
									100
								).toFixed(1)
							: 0}% of total sessions
					</p>
				</div>

				<!-- Bunker Step Completed -->
				<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h2 class="mb-2 text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
						Bunker step completed
					</h2>
					<p class="text-4xl font-bold text-purple-600 dark:text-purple-400">
						{analyticsData.bunkerCompletedSessions}
					</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{analyticsData.completedSessions > 0
							? (
									(analyticsData.bunkerCompletedSessions / analyticsData.completedSessions) *
									100
								).toFixed(1)
							: 0}% of total sessions
					</p>
				</div>

				<!-- Follow Step Completed -->
				<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
					<h2 class="mb-2 text-sm font-medium uppercase text-gray-500 dark:text-gray-400">
						Follow step completed
					</h2>
					<p class="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
						{analyticsData.followCompletedSessions}
					</p>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{analyticsData.completedSessions > 0
							? (
									(analyticsData.followCompletedSessions / analyticsData.completedSessions) *
									100
								).toFixed(1)
							: 0}% of total sessions
					</p>
				</div>
			</div>

			<!-- Activity Chart -->
			<div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
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

			<!-- Funnel Visualization -->
			<div class="mb-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-medium text-gray-800 dark:text-white">
					Wizard funnel analysis
				</h2>
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

				{#if browser && analyticsData && analyticsData.funnelData}
					<div class="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
						<h3 class="text-md mb-2 font-medium text-gray-800 dark:text-white">Funnel insights</h3>
						<ul class="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300">
							<li class="mb-1">
								The horizontal bars show the number of users at each step of the wizard
							</li>
							<li class="mb-1">
								<span class="font-medium text-green-600 dark:text-green-400">Green</span> segments represent
								users who completed the step
							</li>
							<li class="mb-1">
								<span class="font-medium text-yellow-500 dark:text-yellow-400">Yellow</span> segments
								represent users who skipped the step
							</li>
							<li class="mb-1">
								{#if analyticsData.funnelData.length > 0}
									The biggest drop-off occurs between
									{(() => {
										const stepOrder = [
											'homepage',
											'yourself',
											'download',
											'email',
											'bunker',
											'follow'
										];
										const sortedSteps = [...analyticsData.funnelData].sort(
											(a, b) => stepOrder.indexOf(a.step_name) - stepOrder.indexOf(b.step_name)
										);

										let biggestDropoff = { fromStep: '', toStep: '', percentage: 0 };

										for (let i = 0; i < sortedSteps.length - 1; i++) {
											const currentTotal = sortedSteps[i].total;
											const nextTotal = sortedSteps[i + 1].total;

											if (currentTotal > 0) {
												const dropPercentage = ((currentTotal - nextTotal) / currentTotal) * 100;

												if (dropPercentage > biggestDropoff.percentage) {
													biggestDropoff = {
														fromStep: sortedSteps[i].step_name,
														toStep: sortedSteps[i + 1].step_name,
														percentage: dropPercentage
													};
												}
											}
										}

										return `<span class="font-medium">${biggestDropoff.fromStep}</span> and <span class="font-medium">${biggestDropoff.toStep}</span> (${biggestDropoff.percentage.toFixed(1)}% drop)`;
									})()}
								{:else}
									Not enough data to determine drop-off points yet
								{/if}
							</li>
						</ul>
					</div>
				{/if}
			</div>

			<!-- Top Sources Table -->
			<div class="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
				<h2 class="mb-4 text-lg font-medium text-gray-800 dark:text-white">Top 30 sources</h2>
				{#if analyticsData.topSources && analyticsData.topSources.length > 0}
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
							<thead class="bg-gray-50 dark:bg-gray-900">
								<tr>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>
										Source
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>
										Sessions
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>
										Completed
									</th>
									<th
										scope="col"
										class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
									>
										% of Total
									</th>
								</tr>
							</thead>
							<tbody
								class="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800"
							>
								{#each analyticsData.topSources as source, i}
									<tr
										class={i % 2 === 0
											? 'bg-white dark:bg-gray-800'
											: 'bg-gray-50 dark:bg-gray-700'}
									>
										<td
											class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white"
										>
											{source.source}
										</td>
										<td
											class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300"
										>
											{source.sessions}
										</td>
										<td
											class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300"
										>
											<span class="text-green-600 dark:text-green-400">{source.completed}</span>
											<span class="text-xs text-gray-400 dark:text-gray-500">
												({source.sessions > 0
													? ((source.completed / source.sessions) * 100).toFixed(1)
													: 0}%)
											</span>
										</td>
										<td
											class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300"
										>
											{analyticsData.totalSessions > 0
												? ((source.sessions / analyticsData.totalSessions) * 100).toFixed(1)
												: 0}%
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p class="text-gray-500 dark:text-gray-400">No source data available.</p>
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
