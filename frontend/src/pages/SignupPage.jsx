import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const SignupPage = ({ invite }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const url = invite
        ? `/api/register/?invite=${invite}`
        : "/api/register/";

      await api.post(url, {
        first_name: firstName,
        last_name:  lastName,
        username: username,
        email: email,
        password: password,
        password2: confirm,
        role: "employee"        // backend will override if invite.role==="manager"
      });

      alert("Signup successful. You can now log in.");
      navigate("/sign-in");
    } catch (err) {
      const detail = err.response?.data?.detail || "Registration failed.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
      <div className="bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text" value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Last Name */}
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text" value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Username */}
          <div>
            <label className="block mb-1">Username</label>
            <input
              type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Email */}
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Password */}
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Confirm */}
          <div>
            <label className="block mb-1">Confirm Password</label>
            <input
              type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/sign-in")}
            className="text-green-400 hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;