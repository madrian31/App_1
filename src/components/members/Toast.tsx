interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div className={`toast${message ? " show" : ""}`}>
      <i className="fa-solid fa-circle-check" />
      <span>{message}</span>
    </div>
  );
}
