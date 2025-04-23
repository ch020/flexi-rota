import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../services/api";

const ManagerSignupPage = () => {
  const [orgName,   setOrgName]   = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [username,  setUsername]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [error,     setError]     = useState("");

  const navigate = useNavigate();
  const invite = new URLSearchParams(useLocation().search).get("invite") || "";

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
      usename: username,
      email: email,
      password: password,
      password2: confirm
    };
    const url = invite
      ? `/api/register/?invite=${invite}`
      : "/api/register/";

    try {
      await api.post(url, payload);
      alert("Signup successful. You can now log in.");
      navigate("/sign-in");
    } catch (err) {
      const msg = err.response?.data?.detail || "Signup failed. Please try again.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-y-auto py-8 px-4">
      <div className="mx-auto bg-gray-900 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Create Organisation & Manager Account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">

          {[
            { label: "Organisation Name", value: orgName, set: setOrgName },
            { label: "First Name", value: firstName, set: setFirstName },
            { label: "Last Name", value: lastName, set: setLastName },
            { label: "Username", value: username, set: setUsername },
            { label: "Email", value: email, set: setEmail, type: "email" },
            { label: "Password", value: password, set: setPassword, type: "password" },
            { label: "Confirm Password", value: confirm, set: setConfirm, type: "password" },
          ].map(({ label, value, set, type = "text" }) => (
            <div key={label}>
              <label className="block mb-1">{label}</label>
              <input
                type={type}
                value={value}
                onChange={(e) => set(e.target.value)}
                className="w-full p-3 bg-black border border-gray-700 rounded text-white"
                required
              />
            </div>
          ))}

          {error && <p className="text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold"
          >
            Sign Up
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