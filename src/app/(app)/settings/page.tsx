import { serverClient, DEMO_COMPANY_ID } from "@/lib/supabase";
import SettingsClient from "./SettingsClient";
import type { Company } from "@/lib/database.types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sb = await serverClient();
  const { data } = await sb.from("companies").select("*").eq("id", DEMO_COMPANY_ID).single();
  return <SettingsClient company={data as Company} />;
}
