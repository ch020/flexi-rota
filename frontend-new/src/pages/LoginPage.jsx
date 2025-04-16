import React, { useState } from "react";
import api, { setAuthCookies } from "../services/api"; // Adjust the path according to where your component is located

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Call the API to login
      const response = await api.post("/login/", { username, password });

      // Extract access and refresh tokens from the response
      const { access, refresh } = response.data;

      // Store the tokens in cookies
      setAuthCookies(access, refresh);

      // Call the onLogin callback to change the app state
      onLogin();
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="bg-black p-8 rounded shadow-lg w-96">
        <h1 className="text-3xl mb-4">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-lg" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 mt-1 border border-white rounded bg-black text-white"
              required
            />
          </div>
          <div>
            <label className="block text-lg" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mt-1 border border-white rounded bg-black text-white"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full p-2 mt-4 bg-green-500 text-white rounded hover:bg-green-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
