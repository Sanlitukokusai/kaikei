"use client";
import { useRouter } from "next/navigation";
import BankImport from "./BankImport";

export default function BankImportClient() {
  const router = useRouter();
  return <BankImport onDone={() => router.refresh()} />;
}
