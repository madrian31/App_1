import { useState } from "react";
import type { FormStatus } from "../types/auth";
import { authErrorMessage, signIn } from "../services/auth/authService";
import { useAuth } from "../auth/authContext";

/** Sign-in form state. After a successful sign-in the Login page sends the
 *  user on, once AuthProvider has loaded their account. */
export function useLoginForm() {
  const { clearNotice } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [identifierError, setIdentifierError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formMessage, setFormMessage] = useState("");

  const validate = () => {
    const idErr = identifier.trim() ? "" : "Please enter your username or email.";
    const pwErr = password ? "" : "Please enter your password.";
    setIdentifierError(idErr);
    setPasswordError(pwErr);
    return !idErr && !pwErr;
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    if (identifierError) setIdentifierError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError("");
  };

  const handleSubmit = async () => {
    setFormMessage("");
    clearNotice();
    if (!validate()) {
      setStatus("idle");
      return;
    }

    setStatus("loading");
    try {
      await signIn(identifier, password, remember);
      setStatus("success");
      setFormMessage("Signing you in…");
    } catch (err) {
      setStatus("error");
      setFormMessage(authErrorMessage(err));
    }
  };

  return {
    identifier,
    password,
    remember,
    setRemember,
    identifierError,
    passwordError,
    status,
    formMessage,
    handleIdentifierChange,
    handlePasswordChange,
    handleSubmit,
  };
}
