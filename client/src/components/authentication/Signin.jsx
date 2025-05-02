import Introduction from './Introduction';
import usePost from '../../hooks/usePost';
import { useState, useRef, useEffect } from 'react';
import SubmitBtn from './SubmitBtn';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import axiosInstance from '../../utils/axiosInstance';
import { Link } from 'react-router-dom';

const Signin = () => {
	const url = '/auth/signin';
	const { post, loading } = usePost(url);
	const [isDisabled, setIsDisabled] = useState(true); // Start disabled until validation passes
	const navigate = useNavigate();
	const { setUser } = useAuthContext();

	const [userDetails, setUserDetails] = useState({
		email: '',
		password: '',
	});
	const [errors, setErrors] = useState({
		email: '',
		password: '',
	});

	// Password validation function
	const validatePassword = (password) => {
		const minLength = password.length >= 8;
		const hasNumber = /\d/.test(password);
		const hasUpperCase = /[A-Z]/.test(password);
		const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

		return {
			isValid: minLength && hasNumber && hasUpperCase && hasSpecialChar,
			errors: {
				length: !minLength
					? 'Password must be at least 8 characters long.'
					: '',
				number: !hasNumber
					? 'Password must contain at least one number.'
					: '',
				upperCase: !hasUpperCase
					? 'Password must contain at least one uppercase letter.'
					: '',
				specialChar: !hasSpecialChar
					? 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).'
					: '',
			},
		};
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setUserDetails({
			...userDetails,
			[name]: value,
		});

		if (name === 'password') {
			const validation = validatePassword(value);
			setErrors((prev) => ({
				...prev,
				password:
					Object.values(validation.errors).find((error) => error) ||
					'',
			}));
			setIsDisabled(
				!(value && !validation.errors.length && userDetails.email)
			);
		} else if (name === 'email') {
			setErrors((prev) => ({
				...prev,
				email: !value ? 'Email is required.' : '',
			}));
			setIsDisabled(!(value && !errors.password && userDetails.password));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsDisabled(true);

		try {
			const { accessToken } = await post(userDetails);
			localStorage.setItem('accessToken', accessToken);
			const res = await axiosInstance.get('/auth/profile', {
				headers: {
					Authorization: `Bearer ${localStorage.getItem(
						'accessToken'
					)}`,
				},
			});
			setUser(res.data);
			navigate('/');
		} catch (error) {
			console.log(error);
			// setError("An unknown error occurred");
		} finally {
			setIsDisabled(false);
		}
	};

	return (
		<>
			<div className="justify-between items-center mt-28 mx-auto w-1/3 p-4 bg-white rounded-lg">
				<Introduction />
				<form className="px-4 py-8" onSubmit={handleSubmit}>
					<input
						type="email"
						name="email"
						placeholder="email"
						onChange={handleChange}
						className={`border mb-4 p-3 rounded-lg w-full focus:outline-none ${
							errors.email ? 'border-red-500' : ''
						}`}
						value={userDetails.email}
					/>
					{errors.email && (
						<p className="text-red-500 text-sm mb-2">
							{errors.email}
						</p>
					)}

					<input
						type="password"
						name="password"
						placeholder="password"
						onChange={handleChange}
						className={`border mb-4 p-3 rounded-lg w-full focus:outline-none ${
							errors.password ? 'border-red-500' : ''
						}`}
						value={userDetails.password}
					/>
					{errors.password && (
						<p className="text-red-500 text-sm mb-2">
							{errors.password}
						</p>
					)}

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
