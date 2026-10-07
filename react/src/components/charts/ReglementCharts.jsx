import { useMemo, useState } from "react";

/**
 * Courbe "Encaissé vs Facturé" sur 12 mois — pattern "emphasis":
 * une seule série colorée (Encaissé, le résultat) contre une référence
 * grise en pointillés (Facturé, l'attendu). Le tracé conserve l'écart
 * = ce qui reste à recouvrer.
 */
export function TrendAreaChart({ data, moneyFormatter }) {
  const width = 640;
  const height = 240;
  const padding = { top: 16, right: 16, bottom: 26, left: 48 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const [hoverIndex, setHoverIndex] = useState(null);

  const safeData = data && data.length ? data : [];
  const stepW = safeData.length > 1 ? innerW / (safeData.length - 1) : innerW;
  const bandW = safeData.length > 0 ? innerW / safeData.length : innerW;

  const maxVal = useMemo(() => {
    const values = safeData.flatMap((d) => [d.facture_total, d.encaisse_total]);
    const max = Math.max(1, ...values);
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const step = magnitude / 2 || 1;
    return Math.ceil(max / step) * step;
  }, [safeData]);

  const x = (i) => padding.left + stepW * i;
  const y = (v) => padding.top + innerH - (innerH * v) / (maxVal || 1);

  const encaissePath = safeData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.encaisse_total).toFixed(1)}`)
    .join(" ");
  const encaisseArea =
    safeData.length > 0
      ? `${encaissePath} L ${x(safeData.length - 1).toFixed(1)} ${(padding.top + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padding.top + innerH).toFixed(1)} Z`
      : "";
  const facturePath = safeData
    .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.facture_total).toFixed(1)}`)
    .join(" ");

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxVal * f));
  const labelEvery = Math.max(1, Math.ceil(safeData.length / 6));
  const hovered = hoverIndex != null ? safeData[hoverIndex] : null;

  if (!safeData.length) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-slate-400">
        Aucune donnée sur la période.
      </div>
    );
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Évolution des encaissements sur 12 mois">
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#e1e0d9"
              strokeWidth="1"
            />
            <text x={padding.left - 8} y={y(t) + 3} textAnchor="end" fontSize="10" fill="#898781">
              {formatCompact(t)}
            </text>
          </g>
        ))}

        {encaisseArea && <path d={encaisseArea} fill="#059669" opacity="0.1" stroke="none" />}
        <path d={facturePath} fill="none" stroke="#c3c2b7" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" />
        <path d={encaissePath} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {safeData.map((d, i) => (
          <circle key={`dot-${i}`} cx={x(i)} cy={y(d.encaisse_total)} r="4" fill="#059669" stroke="#fff" strokeWidth="2" />
        ))}

        {hoverIndex != null && (
          <line
            x1={x(hoverIndex)}
            x2={x(hoverIndex)}
            y1={padding.top}
            y2={padding.top + innerH}
            stroke="#898781"
            strokeWidth="1"
          />
        )}

        {safeData.map((d, i) => (
          <rect
            key={`hit-${i}`}
            x={x(i) - bandW / 2}
            y={padding.top}
            width={bandW}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
            onFocus={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onBlur={() => setHoverIndex(null)}
            tabIndex={0}
          />
        ))}

        {safeData.map(
          (d, i) =>
            (i % labelEvery === 0 || i === safeData.length - 1) && (
              <text key={`lbl-${i}`} x={x(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#898781">
                {d.label}
              </text>
            )
        )}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: `${(x(hoverIndex) / width) * 100}%` }}
        >
          <div className="font-bold text-slate-700">{hovered.label}</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-0.5 w-3 rounded bg-emerald-600" />
            <span className="font-bold text-slate-900">{moneyFormatter(hovered.encaisse_total)}</span>
            <span className="text-slate-400">encaissé</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="h-0 w-3 border-t-2 border-dashed border-slate-300" />
            <span className="font-semibold text-slate-600">{moneyFormatter(hovered.facture_total)}</span>
            <span className="text-slate-400">facturé</span>
          </div>
        </div>
      )}

      <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded bg-emerald-600" />
          Encaissé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0 w-4 border-t-2 border-dashed border-slate-300" />
          Facturé (référence)
        </span>
      </div>
    </div>
  );
}

/**
 * Classement horizontal à teinte unique (job "comparer une magnitude"):
 * une seule couleur par graphique, longueur = valeur, valeur affichée
 * directement au bout de la barre.
 */
export function BarRankChart({ data, color, moneyFormatter, emptyLabel }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const safeData = data && data.length ? data : [];

  if (!safeData.length) {
    return (
      <div className="flex h-40 items-center justify-center text-center text-sm text-slate-400">
        {emptyLabel || "Aucune donnée disponible."}
      </div>
    );
  }

  const max = Math.max(1, ...safeData.map((d) => d.total));

  return (
    <div className="space-y-3">
      {safeData.map((d, i) => {
        const pct = Math.max((d.total / max) * 100, 3);
        return (
          <div
            key={d.label}
            onMouseEnter={() => setHoverIndex(i)}
            onMouseLeave={() => setHoverIndex(null)}
            onFocus={() => setHoverIndex(i)}
            onBlur={() => setHoverIndex(null)}
            tabIndex={0}
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
              <span className="truncate">{d.label}</span>
              <span className="font-bold text-slate-900">{moneyFormatter(d.total)}</span>
            </div>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width,opacity]"
                style={{ width: `${pct}%`, backgroundColor: color, opacity: hoverIndex === i ? 1 : 0.85 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatCompact(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toFixed(0);
}
