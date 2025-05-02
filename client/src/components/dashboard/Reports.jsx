import { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { useAuthContext } from '../../context/AuthContext';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js';

ChartJS.register(
	CategoryScale,
	LinearScale,
	BarElement,
	ArcElement,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend
);

const Reports = () => {
	const { user } = useAuthContext();
	const [reports, setReports] = useState({
		totalInventoryValue: 0,
		numInventoryItems: 0,
		orderSummary: { pending: 0, completed: 0 },
		totalOrders: 0,
		supplierSummary: [],
		inventoryStatus: { 'In Stock': 0, 'Out of Stock': 0 },
		orderTrend: { labels: [], data: [] }, // Changed from [] to object with labels and data
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [dateRange, setDateRange] = useState({
		startDate: '',
		endDate: '',
	});

	useEffect(() => {
		const fetchReports = async () => {
			try {
				const params = {};
				if (dateRange.startDate && dateRange.endDate) {
					const startDate = parseDate(dateRange.startDate);
					const endDate = parseDate(dateRange.endDate);
					if (!startDate || !endDate) {
						throw new Error(
							'Invalid date format. Please use mm/dd/yyyy.'
						);
					}
					if (startDate > endDate) {
						throw new Error('Start date cannot be after end date.');
					}
					params.created_at = {
						$gte: startDate.toISOString(),
						$lte: endDate.toISOString(),
					};
				}

				// Fetch inventory data
				const inventoryRes = await axiosInstance.get('/inventory', {
					params,
				});
				const inventoryItems = inventoryRes.data;
				const totalInventoryValue = inventoryItems.reduce(
					(sum, item) => sum + (item.quantity * item.unit_price || 0),
					0
				);
				const numInventoryItems = inventoryItems.length;
				const inventoryStatus = inventoryItems.reduce(
					(acc, item) => {
						acc[item.status] = (acc[item.status] || 0) + 1;
						return acc;
					},
					{ 'In Stock': 0, 'Out of Stock': 0 }
				);

				// Fetch order data
				const orderRes = await axiosInstance.get('/orders', { params });
				const orders = orderRes.data || [];
				const orderSummary = orders.reduce(
					(acc, order) => {
						acc[order.status] = (acc[order.status] || 0) + 1;
						return acc;
					},
					{ pending: 0, completed: 0 }
				);
				const totalOrders = orders.length;

				// Aggregate order trend by month
				const orderTrendMap = (orders || []).reduce((acc, order) => {
					if (order.created_at) {
						const date = new Date(order.created_at);
						const month = date.toLocaleString('default', {
							month: 'short',
							year: 'numeric',
						});
						acc[month] = (acc[month] || 0) + 1;
					}
					return acc;
				}, {});

				console.log('Order Trend', orderTrendMap);

				// Sort months chronologically
				const trendLabels = Object.keys(orderTrendMap).sort((a, b) => {
					const dateA = new Date(a);
					const dateB = new Date(b);
					return dateA - dateB;
				});
				const trendData = trendLabels.map(
					(label) => orderTrendMap[label] || 0
				);

				// Fetch supplier data and order totals
				const supplierRes = await axiosInstance.get('/suppliers');
				const suppliers = supplierRes.data || [];
				const orderTotals = await Promise.all(
					suppliers.map(async (supplier) => {
						const supplierOrders = (orders || []).filter(
							(order) =>
								order.supplier_id?._id?.toString() ===
								supplier._id?.toString()
						);
						const totalAmount = (supplierOrders || []).reduce(
							(sum, order) => sum + (order?.total_amount || 0),
							0
						);
						const avgOrderValue = supplierOrders.length
							? totalAmount / supplierOrders.length
							: 0;
						return {
							...supplier,
							totalOrderAmount: totalAmount,
							avgOrderValue,
						};
					})
				);

				setReports({
					totalInventoryValue,
					numInventoryItems,
					orderSummary,
					totalOrders,
					supplierSummary: orderTotals,
					inventoryStatus,
					orderTrend: { labels: trendLabels, data: trendData },
				});
				setError(null); // Clear any previous error on successful fetch
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

		fetchReports();
	}, [dateRange]);

	const parseDate = (dateStr) => {
		const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
		if (!regex.test(dateStr)) return null;
		const [month, day, year] = dateStr.split('/');
		return new Date(
			`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
		);
	};

	const handleDateChange = (e) => {
		const { name, value } = e.target;
		setDateRange((prev) => ({ ...prev, [name]: value }));
	};

	const handleFilter = () => {
		setLoading(true); // Re-fetch data with new date range
	};

	// Chart Data
	const orderChartData = {
		labels: ['Pending', 'Completed'],
		datasets: [
			{
				label: 'Order Status',
				data: [
					reports?.orderSummary?.pending || 0,
					reports?.orderSummary?.completed || 0,
				],
				backgroundColor: ['#FF6384', '#36A2EB'],
				hoverBackgroundColor: ['#FF4F70', '#2A91D8'],
			},
		],
	};

	const supplierChartData = {
		labels: (reports?.supplierSummary || []).map((s) => s?.name || ''),
		datasets: [
			{
				data: (reports?.supplierSummary || []).map(
					(s) => s?.totalOrderAmount || 0
				),
				backgroundColor: ['#F4A5A5', '#F4E5A5', '#A5C9F4', '#C9A5F4'],
				hoverBackgroundColor: [
					'#EF8F8F',
					'#EFDB8F',
					'#8FB7EF',
					'#B78FEF',
				],
			},
		],
	};

	const inventoryStatusChartData = {
		labels: ['In Stock', 'Out of Stock'],
		datasets: [
			{
				data: [
					reports?.inventoryStatus['In Stock'] || 0,
					reports?.inventoryStatus['Out of Stock'] || 0,
				],
				backgroundColor: ['#4BC0C0', '#FF9F40'],
				hoverBackgroundColor: ['#3BA8A8', '#FF8C00'],
			},
		],
	};

	const orderTrendChartData = {
		labels: reports?.orderTrend?.labels || [],
		datasets: [
			{
				label: 'Number of Orders',
				data: reports?.orderTrend?.data || [],
				borderColor: '#36A2EB',
				backgroundColor: 'rgba(54, 162, 235, 0.2)',
				tension: 0.1,
				fill: true,
			},
		],
	};

	return (
		<div className="p-6 ml-[17%] mt-[6%] w-[82%] bg-gray-100 min-h-screen">
			<h1 className="text-3xl font-semibold text-gray-800 mb-6">
				Reports Dashboard
			</h1>
			<div className="mb-4 flex space-x-4">
				<input
					type="text"
					name="startDate"
					value={dateRange?.startDate || ''}
					onChange={handleDateChange}
					placeholder="mm/dd/yyyy"
					className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
				/>
				<input
					type="text"
					name="endDate"
					value={dateRange?.endDate || ''}
					onChange={handleDateChange}
					placeholder="mm/dd/yyyy"
					className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
				/>
				<button
					onClick={handleFilter}
					className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
				>
					Filter
				</button>
			</div>
			{error && (
				<div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
					{error}
				</div>
			)}
			{loading && <div className="p-4 text-gray-600">Loading...</div>}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Inventory & Orders Card */}
				<div className="bg-white p-6 rounded-lg shadow-lg">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Inventory & Orders
					</h2>
					<div className="space-y-2">
						<p className="text-gray-600">
							<span className="font-medium">
								Total Inventory Value:
							</span>{' '}
							<span className="text-blue-600">
								${reports.totalInventoryValue.toFixed(2)}
							</span>
						</p>
						<p className="text-gray-600">
							<span className="font-medium">
								Number of Items:
							</span>{' '}
							<span className="text-blue-600">
								{reports.numInventoryItems}
							</span>
						</p>
						<p className="text-gray-600">
							<span className="font-medium">Total Orders:</span>{' '}
							<span className="text-blue-600">
								{reports.totalOrders}
							</span>
						</p>
					</div>
				</div>

				{/* Order Summary Chart */}
				<div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Order Status Summary
					</h2>
					<div className="h-64">
						<Pie
							data={orderChartData}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								plugins: {
									legend: {
										position: 'top',
										labels: { font: { size: 14 } },
									},
									tooltip: {
										backgroundColor: '#333',
										titleFont: { size: 14 },
										bodyFont: { size: 12 },
									},
								},
							}}
						/>
					</div>
				</div>

				{/* Inventory Status Chart */}
				<div className="bg-white p-6 rounded-lg shadow-lg">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Inventory Status
					</h2>
					<div className="h-64">
						<Doughnut
							data={inventoryStatusChartData}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								plugins: {
									legend: {
										position: 'top',
										labels: { font: { size: 14 } },
									},
									tooltip: {
										backgroundColor: '#333',
										titleFont: { size: 14 },
										bodyFont: { size: 12 },
									},
								},
							}}
						/>
					</div>
				</div>

				{/* Order Trend Chart */}
				<div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-2">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Order Trend Over Time
					</h2>
					<div className="h-64">
						{reports?.orderTrend?.labels?.length > 0 ? (
							<Line
								data={orderTrendChartData}
								options={{
									responsive: true,
									maintainAspectRatio: false,
									scales: {
										x: {
											title: {
												display: true,
												text: 'Month',
											},
										},
										y: {
											beginAtZero: true,
											title: {
												display: true,
												text: 'Number of Orders',
											},
										},
									},
									plugins: {
										legend: {
											position: 'top',
											labels: { font: { size: 14 } },
										},
										tooltip: {
											backgroundColor: '#333',
											titleFont: { size: 14 },
											bodyFont: { size: 12 },
										},
									},
								}}
							/>
						) : (
							<p className="text-gray-600 text-center">
								No order data available for the selected date
								range.
							</p>
						)}
					</div>
				</div>

				{/* Supplier Summary Chart */}
				<div className="bg-white p-6 rounded-lg shadow-lg lg:col-span-3">
					<h2 className="text-xl font-semibold text-gray-700 mb-4">
						Supplier Performance
					</h2>
					<div className="h-64 mb-4">
						<Bar
							data={supplierChartData}
							options={{
								responsive: true,
								maintainAspectRatio: false,
								scales: {
									y: {
										beginAtZero: true,
										title: {
											display: true,
											text: 'Total Amount (sh)',
										},
									},
									x: {
										title: {
											display: true,
											text: 'Suppliers',
										},
									},
								},
								plugins: {
									legend: { display: false },
									tooltip: {
										backgroundColor: '#333',
										titleFont: { size: 14 },
										bodyFont: { size: 12 },
									},
								},
							}}
						/>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
						{reports.supplierSummary.map((supplier) => (
							<div
								key={supplier._id}
								className="text-sm text-gray-600"
							>
								<p>
									<span className="font-medium">
										{supplier.name}:
									</span>{' '}
									Total {supplier.totalOrderAmount.toFixed(2)}{' '}
									sh, Avg {supplier.avgOrderValue.toFixed(2)}{' '}
									sh
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Reports;
