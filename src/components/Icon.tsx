"use client";
import { icons } from "lucide-react";
import { type CSSProperties, type SVGProps } from "react";

const ALIAS: Record<string, keyof typeof icons> = {
  Home: "House",
  BarChart3: "ChartColumn",
  Edit3: "Pencil",
};

type Props = {
  name: keyof typeof icons | keyof typeof ALIAS;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "ref" | "name" | "stroke" | "style" | "className">;

export default function Icon({ name, size = 16, stroke = 1.5, className, style, ...rest }: Props) {
  const resolved = (ALIAS[name as string] ?? name) as keyof typeof icons;
  const L = icons[resolved];
  if (!L) return null;
  return (
    <L
      width={size}
      height={size}
      strokeWidth={stroke}
      className={className}
      style={{ display: "inline-block", verticalAlign: "middle", ...style }}
      {...rest}
    />
  );
}
