export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (email: string): string => {
  if (!email.trim()) return "Please enter your email address";
  if (!EMAIL_PATTERN.test(email.trim())) return "That email doesn't look quite right";
  return "";
};

export const validatePassword = (password: string): string => {
  if (!password) return "Please enter your password";
  if (password.length < 8) return "Password must be at least 8 characters";
  return "";
};