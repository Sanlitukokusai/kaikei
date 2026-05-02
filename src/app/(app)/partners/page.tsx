import Link from "next/link";
import Icon from "@/components/Icon";
import { Button, Card, Chip } from "@/components/ui";
import { listPartners, partnerSalesSummary } from "@/lib/queries";

const kindTone = { corp: "i", individual: "n", overseas: "w" } as const;
const kindLabel = { corp: "法人", individual: "個人", overseas: "海外" };

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const [partners, summary] = await Promise.all([listPartners(), partnerSalesSummary()]);

  return (
    <div>
      <div className="page-h">
        <div>
          <div className="breadcrumb"><Icon name="Home" size={12} /><span>ホーム</span> / <span style={{ color: "var(--foreground-700)" }}>取引先</span></div>
          <h1 className="h1">取引先・送付先</h1>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{partners.length}件</div>
        </div>
        <Link href="/partners/new"><Button variant="primary" icon="Plus">取引先を追加</Button></Link>
      </div>

      <Card className="tight">
        <table className="tbl">
          <thead>
            <tr>
              <th>取引先名</th>
              <th>種別</th>
              <th>適格番号</th>
              <th className="num">売上累計</th>
              <th className="num">未収金</th>
              <th>最終取引</th>
              <th style={{ width: 40 }} />
            </tr>
          </thead>
          <tbody>
            {partners.map((p) => {
              const s = summary.get(p.id);
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    {p.name_kana && <div style={{ fontSize: 11, color: "var(--foreground-500)" }}>{p.name_kana}</div>}
                  </td>
                  <td><Chip tone={kindTone[p.kind]}>{kindLabel[p.kind]}</Chip></td>
                  <td>
                    {p.invoice_reg_no
                      ? <span className="code" style={{ fontSize: 11 }}>{p.invoice_reg_no}</span>
                      : <span style={{ color: "var(--foreground-400)", fontSize: 12 }}>—</span>}
                  </td>
                  <td className="num">{s ? `¥${s.total.toLocaleString()}` : "—"}</td>
                  <td className="num" style={{ color: s?.due ? "var(--money-negative)" : undefined }}>
                    {s?.due ? `¥${s.due.toLocaleString()}` : "—"}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--foreground-500)" }}>
                    {s?.last ? s.last.slice(0, 7).replaceAll("-", "/") : "—"}
                  </td>
                  <td>
                    <Link href={`/partners/${p.id}`}>
                      <Icon name="Pencil" size={15} style={{ color: "var(--foreground-400)", cursor: "pointer" }} />
                    </Link>
                  </td>
                </tr>
              );
            })}
            {partners.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "var(--foreground-500)" }}>取引先がまだ登録されていません</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
