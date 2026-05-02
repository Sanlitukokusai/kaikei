"use client";
import { useState } from "react";
import { signOut } from "@/app/actions/auth";
import Icon from "./Icon";

export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const initial = email.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="yc-topbar-avatar"
        style={{ border: "none", cursor: "pointer", padding: 0 }}
        aria-label="ユーザメニュー"
      >
        {initial}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
          <div
            style={{
              position: "absolute", right: 0, top: 40, width: 220, zIndex: 51,
              background: "#fff", border: "1px solid var(--zinc-200)",
              borderRadius: 10, boxShadow: "var(--shadow-medium)", padding: 6, fontSize: 13,
            }}
          >
            <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--foreground-500)", borderBottom: "1px solid var(--zinc-100)" }}>
              {email}
            </div>
            <form action={signOut}>
              <button
                type="submit"
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", border: 0, background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: "var(--foreground-700)", borderRadius: 6, textAlign: "left" }}
              >
                <Icon name="LogOut" size={14} />ログアウト
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
