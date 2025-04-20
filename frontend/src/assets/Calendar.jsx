import React from "react";
import ReactCalendar from "react-calendar";
import "./Calendar.css";    // your existing CSS

export default function Calendar(props) {
  return <ReactCalendar {...props} />;
}