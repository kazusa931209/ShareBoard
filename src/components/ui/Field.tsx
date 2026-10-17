import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Field({ label, className, ...inputProps }: FieldProps) {
  return (
    <label className={className}>
      {label}
      <input {...inputProps} />
    </label>
  );
}
