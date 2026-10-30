export default function Loading() {
  return (
    <div className="page-shell" aria-busy="true" aria-live="polite">
      <div className="skeleton" style={{ height: 150 }} />
      <div className="skeleton" style={{ height: 260 }} />
      <div className="skeleton" style={{ height: 120 }} />
    </div>
  );
}
