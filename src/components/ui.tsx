"use client";
import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Icon from "./Icon";
import { type icons } from "lucide-react";

type IconName = keyof typeof icons | "Home" | "BarChart3" | "Edit3";

type ButtonProps = {
  children?: ReactNode;
  variant?: "primary" | "bordered" | "light" | "secondary" | "danger";
  size?: "sm" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ children, variant = "bordered", size, icon, iconRight, className = "", type = "button", ...rest }: ButtonProps) {
  const cls = ["btn", variant, size, className].filter(Boolean).join(" ");
  return (
    <button type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16} />}
    </button>
  );
}

export function Chip({ tone = "n", children, dot = true }: { tone?: "s" | "w" | "d" | "i" | "n"; children?: ReactNode; dot?: boolean }) {
  return (
    <span className={`chip ${tone}`}>
      {dot && <span className="dot" />}
      {children}
    </span>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
  span = 6,
}: {
  label?: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
  span?: number;
}) {
  return (
    <div className={`field col-${span}`}>
      {label && (
        <label>
          {label}
          {required && <span className="req"> *</span>}
        </label>
      )}
      {children}
      {(error || hint) && <div className={`hint ${error ? "err" : ""}`}>{error || hint}</div>}
    </div>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`input ${className}`} {...rest} />;
}

export function Textarea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`input ${className}`} {...rest} />;
}

export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { children?: ReactNode }) {
  return (
    <select className={`input ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
  style,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {(title || action) && (
        <div className="card-h">
          {title && <h2 className="h2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function YcChip({ kind, children }: { kind: "paid" | "billed" | "unbilled"; children?: ReactNode }) {
  return <span className={`yc-chip yc-chip-${kind}`}>{children}</span>;
}

export const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
