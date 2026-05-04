export const Toast = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast ${t.type}`}>
        <i className={t.type === 'success' ? 'fas fa-check-circle' : t.type === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-info-circle'}></i>
        {t.message}
      </div>
    ))}
  </div>
);
