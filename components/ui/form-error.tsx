export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <p role="alert" className="bg-accent-danger/10 text-accent-danger rounded-lg px-3 py-2 text-sm">
      {message}
    </p>
  );
}
