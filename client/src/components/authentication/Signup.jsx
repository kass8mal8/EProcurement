import { Link, useNavigate } from 'react-router-dom';
import Introduction from './Introduction';
import { useState } from 'react';
import usePost from '../../hooks/usePost';
import SubmitBtn from './SubmitBtn';

const Signup = () => {
	const [userDetails, setUserDetails] = useState({
		name: '',
		email: '',
		password: '',
	});
	const [errors, setErrors] = useState({
		name: '',
		email: '',
		password: '',
	});
	const navigate = useNavigate();

	const url = '/auth/signup';
	const { post, loading } = usePost(url);

	// Validation functions
	const validateName = (name) => {
		const hasLetter = /[a-zA-Z]/.test(name);
		return {
			isValid: name && hasLetter,
			error: !name
				? 'Name is required.'
				: !hasLetter
				? 'Name must contain at least one letter.'
				: '',
		};
	};

	const validateEmail = (email) => {
		return {
			isValid: email.length > 0,
			error: !email ? 'Email is required.' : '',
		};
	};

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

		if (name === 'name') {
			const validation = validateName(value);
			setErrors((prev) => ({
				...prev,
				name: validation.error,
			}));
		} else if (name === 'email') {
			const validation = validateEmail(value);
			setErrors((prev) => ({
				...prev,
				email: validation.error,
			}));
		} else if (name === 'password') {
			const validation = validatePassword(value);
			setErrors((prev) => ({
				...prev,
				password:
					Object.values(validation.errors).find((error) => error) ||
					'',
			}));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		const nameValidation = validateName(userDetails.name);
		const emailValidation = validateEmail(userDetails.email);
		const passwordValidation = validatePassword(userDetails.password);

		if (
			!nameValidation.isValid ||
			!emailValidation.isValid ||
			!passwordValidation.isValid
		) {
			setErrors({
				name: nameValidation.error,
				email: emailValidation.error,
				password:
					Object.values(passwordValidation.errors).find(
						(error) => error
					) || '',
			});
			return;
		}

		try {
			await post(userDetails);
			navigate('/signin');
		} catch (error) {
			console.log(error);
		}
	};

	return (
		<div className="justify-between items-center mt-28 mx-auto w-1/3 p-4 bg-white rounded-lg">
			<Introduction />
			<form className="p-4" onSubmit={handleSubmit}>
				<div className="flex space-x-3 w-full">
					<input
						type="text"
						name="name"
						placeholder="name"
						onChange={handleChange}
						value={userDetails.name}
						className={`border border-neutral-400 mb-4 p-3 rounded-lg w-full focus:outline-none ${
							errors.name ? 'border-red-500' : ''
						}`}
					/>
				</div>
				{errors.name && (
					<p className="text-red-500 text-sm mb-2">{errors.name}</p>
				)}

				<input
					type="email"
					name="email"
					placeholder="email"
					onChange={handleChange}
					value={userDetails.email}
					className={`border border-neutral-400 mb-4 p-3 rounded-lg w-full focus:outline-none ${
						errors.email ? 'border-red-500' : ''
					}`}
				/>
				{errors.email && (
					<p className="text-red-500 text-sm mb-2">{errors.email}</p>
				)}

				<input
					type="password"
					name="password"
					placeholder="password"
					onChange={handleChange}
					value={userDetails.password}
					className={`border border-neutral-400 mb-4 p-3 rounded-lg w-full focus:outline-none ${
						errors.password ? 'border-red-500' : ''
					}`}
				/>
				{errors.password && (
					<p className="text-red-500 text-sm mb-2">
						{errors.password}
					</p>
				)}

				<SubmitBtn loading={loading} />
			</form>
			<p className="mt-3 ml-4 text-gray-400">
				Already have an account? <Link to="/signin">Signin</Link>
			</p>
		</div>
	);
};

export default Signup;
