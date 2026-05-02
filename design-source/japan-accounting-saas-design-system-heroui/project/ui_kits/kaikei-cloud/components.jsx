/* global React */
const { useState, useEffect, useMemo } = React;

// ========== Icon ==========
function Icon({ name, size = 16, stroke = 1.5, style, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.innerHTML = '';
      const i = document.createElement('i');
      i.setAttribute('data-lucide', name);
      ref.current.appendChild(i);
      window.lucide.createIcons({ attrs: { 'stroke-width': stroke, width: size, height: size } });
    }
  }, [name, size, stroke]);
  return <span ref={ref} className={className} style={{ display: 'inline-flex', ...style }} />;
}

// ========== Button ==========
function Button({ children, variant = 'bordered', size, className = '', icon, iconRight, onClick, disabled, type = 'button' }) {
  const cls = ['btn', variant, size, className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 14 : 16} />}
    </button>
  );
}

// ========== Chip ==========
function Chip({ tone = 'n', children, dot = true }) {
  return <span className={`chip ${tone}`}>{dot && <span className="dot" />}{children}</span>;
}

// ========== Input / Field ==========
function Field({ label, required, hint, error, children, span = 6 }) {
  return (
    <div className={`field col-${span}`}>
      {label && <label>{label}{required && <span className="req"> *</span>}</label>}
      {children}
      {(error || hint) && <div className={`hint ${error ? 'err' : ''}`}>{error || hint}</div>}
    </div>
  );
}
function Input(props) { return <input className={`input ${props.className || ''}`} {...props} />; }
function Select({ children, ...rest }) { return <select className="input" {...rest}>{children}</select>; }

// ========== Card ==========
function Card({ title, action, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {(title || action) && (
        <div className="card-h">
          {title && <h2 className="h2">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ========== Sidebar ==========
const NAV_GROUPS = [
  {
    items: [
      { id: 'dashboard', label: 'ホーム',         icon: 'home' },
      { id: 'estimate',  label: '見積書',         icon: 'file-text' },
      { id: 'delivery',  label: '納品書',         icon: 'file-text' },
      { id: 'invoices',  label: '請求書',         icon: 'file-text' },
      { id: 'journal',   label: '仕訳帳',         icon: 'book-open' },
      { id: 'bank',      label: '銀行連携',       icon: 'landmark' },
      { id: 'voucher',   label: '証憑・経費',     icon: 'scan-line' },
      { id: 'reports',   label: 'レポート',       icon: 'bar-chart-3' },
      { id: 'partners',  label: '取引先・送付先', icon: 'users' },
      { id: 'items',     label: '品目',           icon: 'package' },
      { id: 'settings',  label: '設定',           icon: 'settings' },
    ]
  },
  {
    items: [
      { id: 'trash',     label: 'ごみ箱',         icon: 'trash-2' },
    ]
  },
];

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar yc-sidebar">
      <div className="yc-sb-brand">
        <span className="yc-sb-brand-name">Kaikei Cloud</span>
        <Icon name="chevrons-left" size={14} />
      </div>
      <nav className="yc-sb-nav">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className="yc-sb-group">
            {group.items.map(item => (
              <div
                key={item.id}
                className={`yc-sb-item ${active === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
                {(item.id === 'invoices' || item.id === 'trash') && <Icon name="chevron-right" size={12} style={{ marginLeft: 'auto', color: '#94a3b8' }} />}
              </div>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ========== Topbar ==========
function Topbar() {
  return (
    <header className="topbar yc-topbar">
      <div style={{ flex: 1 }} />
      <div className="yc-topbar-org">三立国際合同会社</div>
      <div className="tb-icon"><Icon name="help-circle" size={18} /></div>
      <div className="tb-icon"><Icon name="bell" size={18} /></div>
      <div className="yc-topbar-avatar">李</div>
    </header>
  );
}

// Export to global for cross-file usage
Object.assign(window, { Icon, Button, Chip, Field, Input, Select, Card, Sidebar, Topbar, NAV_GROUPS });
