import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

const ManagerSignupPage = ({ onSignup }) => {
  const [orgName,   setOrgName]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");
  const navigate = useNavigate();
  const { search } = useLocation();
  const invite = new URLSearchParams(search).get("invite") || "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    const payload = {
      organisation_name: orgName,
      role: "manager",
      first_name: firstName,
      last_name: lastName,
      username,
      email,
      password,
      password2: confirm
    };
    const url = invite
      ? `/api/register/?invite=${invite}`
      : "/api/register/";

    try {
      await api.post(url, payload, { withCredentials: true });
      navigate("/sign-in");
    } catch (err) {
      setError(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-y-auto py-8 px-4">
      <div className="mx-auto bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Organisation & Manager Account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organisation Name */}
          <div>
            <label className="block mb-1">Organisation Name</label>
            <input
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* First Name */}
          <div>
            <label className="block mb-1">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Last Name */}
          <div>
            <label className="block mb-1">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Username */}
          <div>
            <label className="block mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Email */}
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Password */}
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-black border border-gray-700 rounded text-white"
              required
            />
          </div>
          {/* Confirm Password */}
          <div>
            <label className="block mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
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
            Create Org & Account
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/sign-in")}
            className="text-green-400 hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default ManagerSignupPage;