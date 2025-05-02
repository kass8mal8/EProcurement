import { Route, Routes } from 'react-router-dom';
import Signup from './components/authentication/Signup';
import Signin from './components/authentication/Signin';
import Dashboard from './components/dashboard/Dashboard';
import { AuthProvider } from './context/AuthContext';
import Items from './components/items/Items';
import Suppliers from './components/suppliers/Suppliers';
import Order from './components/orders/Order';
import Index from './components/dashboard/Index';
import Reports from './components/dashboard/Reports';

const App = () => {
	return (
		<AuthProvider>
			<Routes>
				<Route path="/" element={<Dashboard />}>
					<Route path="orders" element={<Order />} />
					<Route path="inventory" element={<Items />} />
					<Route path="suppliers" element={<Suppliers />} />
					<Route path="reports" element={<Reports />} />
					<Route path="/" element={<Index />} />
				</Route>
				<Route path="/signup" element={<Signup />} />
				<Route path="/signin" element={<Signin />} />
			</Routes>
		</AuthProvider>
	);
};

export default App;
