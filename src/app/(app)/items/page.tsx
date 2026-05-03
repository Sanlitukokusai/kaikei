import Icon from "@/components/Icon";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default function ItemsPage() {
  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb">
            <Icon name="Home" size={12} />
            <span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>品目</span>
          </div>
          <h1 className="h1">品目マスタ</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
            請求書・見積書で使用する品目を管理します
          </div>
        </div>
      </div>
      <Card>
        <div style={{ padding: 48, textAlign: "center" }}>
          <Icon name="Package" size={48} style={{ color: "var(--foreground-400)" }} />
          <h2 style={{ fontSize: 18, margin: "16px 0 8px", fontWeight: 600 }}>準備中</h2>
          <p style={{ color: "var(--foreground-500)", fontSize: 13, margin: 0 }}>
            品目マスタ機能は現在開発中です。
          </p>
        </div>
      </Card>
    </div>
  );
}
