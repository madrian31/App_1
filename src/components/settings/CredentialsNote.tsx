import { useState } from "react";

interface CredentialsNoteProps {
  name: string;
  username: string;
  password: string;
}

/** The sign-in details to hand over after making an account or resetting a
 *  password — the password isn't shown again after this. */
export default function CredentialsNote({ name, username, password }: CredentialsNoteProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`LINK Up sign-in\nUsername: ${username}\nPassword: ${password}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="account-credentials">
      <p className="account-credentials-lead">
        Give these sign-in details to <strong>{name}</strong>. The password won't be shown again.
      </p>
      <dl className="account-credentials-list">
        <dt>Username</dt>
        <dd>{username}</dd>
        <dt>Password</dt>
        <dd>{password}</dd>
      </dl>
      <button type="button" className="btn-secondary account-credentials-copy" onClick={copy}>
        <i className={`fa-regular ${copied ? "fa-circle-check" : "fa-copy"}`} aria-hidden="true" />
        {copied ? "Copied" : "Copy sign-in details"}
      </button>
      <p className="account-field-hint">
        Ask them to change this password after they sign in, using the key button beside their name at the bottom of
        the menu.
      </p>
    </div>
  );
}
