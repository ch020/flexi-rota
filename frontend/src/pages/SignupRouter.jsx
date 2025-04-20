import React from "react";
import { useLocation } from "react-router-dom";
import InviteSignupPage from "./SignupPage";
import ManagerSignupPage from "./ManagerSignupPage";

export default function SignupRouter({ onSignup }) {
  const invite = new URLSearchParams(useLocation().search).get("invite");
  return invite
    ? <InviteSignupPage onSignup={onSignup} invite={invite} />
    : <ManagerSignupPage onSignup={onSignup} />;
}