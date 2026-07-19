import type { ReactNode } from "react";

type LoginModalProps = {
  onClose: () => void;
  children: ReactNode;
};

export function LoginModal({ onClose, children }: LoginModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}