import React from "react";
import { useLocation } from "react-router-dom";
import InviteSignupPage from "./SignupPage";
import ManagerSignupPage from "./ManagerSignupPage";

export default function SignupRouter() {
  const invite = new URLSearchParams(useLocation().search).get("invite");

  return invite
    ? <InviteSignupPage invite={invite} />
    : <ManagerSignupPage />;
}