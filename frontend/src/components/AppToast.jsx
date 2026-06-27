import { useEffect } from "react";

function AppToast({ show, type = "success", title, message, onClose }) {
  useEffect(() => {
    if (!show) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, 3500);

    return () => clearTimeout(timer);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`app-toast ${type}`}>
      <div className="app-toast-icon">
        <i
          className={`bi ${
            type === "success"
              ? "bi-check-circle-fill"
              : type === "error"
              ? "bi-x-circle-fill"
              : "bi-info-circle-fill"
          }`}
        ></i>
      </div>

      <div className="app-toast-content">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>

      <button className="app-toast-close" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
    </div>
  );
}

export default AppToast;