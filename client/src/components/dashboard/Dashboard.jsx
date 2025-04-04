import { Outlet, useLocation } from "react-router-dom";
import NavBar from "../navigation/NavBar";
import SideNav from "../navigation/SideNav";
// import useFetch from "../../hooks/useFetch";
import { useAuthContext } from "../../context/AuthContext";
import { useState } from "react";
// import Index from "./Index";

const Dashboard = () => {
	// const { data: orders } = useFetch("/orders", "orders");
	const { user } = useAuthContext();
	const location = useLocation();
	const [seconds, setSeconds] = useState(user === null ? 5 : 0);

	if (seconds !== 0) setInterval(() => setSeconds(seconds - 1), 1000);

	return (
		<div>
			{user === null && location.pathname !== "/signup" && (
				<div className="text-gray-500 absolute text-center bg-red-100 top-[12%] z-50 ml-[50%] p-2 rounded">
					Navigating to signin in {seconds} seconds
				</div>
			)}
			<NavBar />
			<SideNav />

			<Outlet />
		</div>
	);
};

export default Dashboard;
