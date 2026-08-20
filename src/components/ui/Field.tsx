import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-secondary"
    >
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[15px] text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function TextField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <Label htmlFor={props.id ?? props.name!}>{label}</Label>
      <input className={inputClass} {...props} />
    </div>
  );
}

export function TextArea({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <Label htmlFor={props.id ?? props.name!}>{label}</Label>
      <textarea className={`${inputClass} min-h-24`} {...props} />
    </div>
  );
}
