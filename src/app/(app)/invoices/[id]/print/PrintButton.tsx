"use client";
import { Button } from "@/components/ui";

export default function PrintButton() {
  return (
    <Button variant="primary" icon="Printer" onClick={() => window.print()}>
      印刷 / PDF保存
    </Button>
  );
}
