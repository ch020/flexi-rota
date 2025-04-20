import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)} // Navigate to the previous page
      className="absolute top-4 left-4 bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
    >
      ← Back
    </button>
  );
};

export default BackButton;