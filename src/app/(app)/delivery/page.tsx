import Icon from "@/components/Icon";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function DeliveryPage() {
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} />
            <span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>納品書</span>
          </div>
          <h1 className="h1">納品書</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            お客様への納品書を作成・管理します
          </div>
        </div>
      </div>
      <Card>
        <div style={{ padding: 48, textAlign: "center" }}>
          <Icon name="FileText" size={48} style={{ color: "var(--foreground-400)" }} />
          <h2 style={{ fontSize: 18, margin: "16px 0 8px", fontWeight: 600 }}>準備中</h2>
          <p style={{ color: "var(--foreground-500)", fontSize: 13, margin: 0 }}>
            納品書機能は現在開発中です。請求書機能をご利用ください。
          </p>
        </div>
      </Card>
    </div>
  );
}
