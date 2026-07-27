interface PaymentButtonProps {
  url?: string;
}

export function PaymentButton({ url }: PaymentButtonProps) {
  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-11 items-center justify-center rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700"
    >
      Pagar ahora
    </a>
  );
}
