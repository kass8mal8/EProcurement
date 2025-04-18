import Introduction from "./Introduction";
import usePost from "../../hooks/usePost";
import { useState, useRef, useEffect } from "react";
import SubmitBtn from "./SubmitBtn";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { Link } from "react-router-dom";

const Signin = () => {
	const url = "/auth/signin";
	const { post, loading } = usePost(url);
	const [isDisabled, setIsDisabled] = useState(false);
	const navigate = useNavigate();
	const { setUser } = useAuthContext();

	const [userDetails, setUserDetails] = useState({
		email: "",
		password: "",
	});
	const handleChange = (e) => {
		setUserDetails({
			...userDetails,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsDisabled(true);

		try {
			const { accessToken } = await post(userDetails);
			localStorage.setItem("accessToken", accessToken);
			const res = await axiosInstance.get("/auth/profile", {
				headers: {
					Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
				},
			});
			setUser(res.data);
			navigate("/");
		} catch (error) {
			console.log(error);
			// setError("An unknown error occurred");
		} finally {
			setIsDisabled(false);
		}
	};

	return (
		<>
			<div className=" justify-between items-center mt-28 mx-auto w-1/3 p-4 bg-white rounded-lg">
				<Introduction />
				<form className="px-4 py-8" onSubmit={handleSubmit}>
					<input
						type="text"
						name="email"
						placeholder="email"
						onChange={handleChange}
						className="border mb-4 p-3 rounded-lg w-full focus:outline-none"
					/>
					<input
						type="password"
						name="password"
						placeholder="password"
						onChange={handleChange}
						minLength={8}
						className="border user-invalid:border-red-200 focus:outline-none mb-4 p-3 rounded-lg w-full"
					/>

					<SubmitBtn loading={loading} isDisabled={isDisabled} />
				</form>
				<p className="mt-3 ml-4 text-gray-400">
					Don't have an account? <Link to="/signup">Signup</Link>
				</p>
			</div>
		</>
	);
};

export default Signin;
