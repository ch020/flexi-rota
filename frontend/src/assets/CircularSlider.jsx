// src/components/CircularSlider.jsx
import React from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "./CircularSlider.css"; // Import custom CSS file for circular styling

const CircularSlider = () => {
  return (
    <div className="slider-container">
      <Slider
        min={0}
        max={100}
        defaultValue={50}
        handleStyle={{
          borderColor: "#ff6347", // Red color for the thumb
          height: 20,
          width: 20,
          marginTop: -10,
        }}
        trackStyle={{
          backgroundColor: "#ddd", // Track color
          height: 10,
        }}
        railStyle={{
          backgroundColor: "#eee", // Rail color
          height: 10,
        }}
      />
    </div>
  );
};

export default CircularSlider;
