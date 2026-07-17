import { useState } from "react";
import { validateEmail, validatePassword } from "../utils/validation";
import type { FormStatus } from "../types/auth";
import { loginUser } from "../services/authService";
import { useNavigate } from "react-router-dom";

export function useLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formMessage, setFormMessage] = useState("");

  const validate = () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    return !emailErr && !passwordErr;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError("");
  };

  const handleSubmit = async () => {
    setFormMessage("");

    if (!validate()) {
      setStatus("idle");
      return;
    }

    setStatus("loading");

    try {
      await loginUser({ email, password });
      setStatus("success");
      setFormMessage("Welcome back!");

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch {
      setStatus("error");
      setFormMessage("We couldn't find an account with those details. Try again or sign up.");
    }
  };

  return {
    email,
    password,
    emailError,
    passwordError,
    status,
    formMessage,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  };
}