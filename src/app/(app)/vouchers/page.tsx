import { listVouchers } from "@/lib/queries";
import VouchersClient from "./VouchersClient";
import type { Voucher } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function VouchersPage() {
  const vouchers = await listVouchers() as Voucher[];
  return <VouchersClient vouchers={vouchers} />;
}
