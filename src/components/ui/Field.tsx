import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-sm font-medium text-ink"
    >
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-hairline-strong bg-surface px-3.5 py-3 text-base text-ink transition-all duration-200 ease-out placeholder:text-ink-secondary/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

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
      <textarea className={`${inputClass} min-h-28`} {...props} />
    </div>
  );
}
