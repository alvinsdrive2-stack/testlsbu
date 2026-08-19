import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-hairline bg-surface px-3 py-2 text-[15px] focus:outline-none focus:ring-2 focus:ring-accent";

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
