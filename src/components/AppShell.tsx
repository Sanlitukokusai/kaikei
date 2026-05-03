import { type ReactNode } from "react";
import Icon from "./Icon";
import UserMenu from "./UserMenu";
import SidebarNav from "./SidebarNav";
import { type icons } from "lucide-react";
import { serverClient } from "@/lib/supabase";
import { getCompany } from "@/lib/queries";

type IconName = keyof typeof icons | "Home" | "BarChart3" | "Edit3";
export type NavItem = { id: string; href: string; label: string; icon: IconName; chevron?: boolean };

const NAV_GROUPS: { items: NavItem[] }[] = [
  {
    items: [
      { id: "dashboard", href: "/", label: "ホーム", icon: "Home" },
      { id: "estimate", href: "/estimate", label: "見積書", icon: "FileText" },
      { id: "delivery", href: "/delivery", label: "納品書", icon: "FileText" },
      { id: "invoices", href: "/invoices", label: "請求書", icon: "FileText", chevron: true },
      { id: "journal", href: "/journal", label: "仕訳帳", icon: "BookOpen" },
      { id: "bank", href: "/bank", label: "銀行連携", icon: "Landmark" },
      { id: "voucher", href: "/vouchers", label: "証憑・経費", icon: "ScanLine" },
      { id: "reports", href: "/reports", label: "レポート", icon: "BarChart3" },
      { id: "partners", href: "/partners", label: "取引先・送付先", icon: "Users" },
      { id: "items", href: "/items", label: "品目", icon: "Package" },
      { id: "settings", href: "/settings", label: "設定", icon: "Settings" },
    ],
  },
  { items: [{ id: "trash", href: "/trash", label: "ごみ箱", icon: "Trash2", chevron: true }] },
];

async function Topbar() {
  const sb = await serverClient();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email ?? "";
  const userMetaCompany = (data.user?.user_metadata as { company_name?: string } | undefined)?.company_name;
  let orgName = userMetaCompany;
  if (!orgName) {
    const company = await getCompany().catch(() => null);
    orgName = company?.name ?? "";
  }
  return (
    <header className="topbar yc-topbar">
      <div style={{ flex: 1 }} />
      {orgName ? <div className="yc-topbar-org">{orgName}</div> : null}
      <div className="tb-icon"><Icon name="HelpCircle" size={18} /></div>
      <div className="tb-icon"><Icon name="Bell" size={18} /></div>
      {email ? <UserMenu email={email} /> : null}
    </header>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <aside className="sidebar yc-sidebar">
        <div className="yc-sb-brand">
          <span className="yc-sb-brand-name">Kaikei Cloud</span>
          <Icon name="ChevronsLeft" size={14} />
        </div>
        <SidebarNav groups={NAV_GROUPS} />
      </aside>
      <Topbar />
      <main className="main">{children}</main>
    </div>
  );
}
