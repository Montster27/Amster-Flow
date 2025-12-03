interface Metric {
  label: string;
  value: string | number;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}

const toneStyles: Record<NonNullable<Metric['tone']>, { bg: string; color: string }> = {
  default: { bg: '#f9fafb', color: '#111827' },
  success: { bg: '#ecfdf3', color: '#166534' },
  danger: { bg: '#fef2f2', color: '#991b1b' },
  warning: { bg: '#fffbeb', color: '#92400e' },
};

interface MetricGridProps {
  metrics: Metric[];
  columns?: 2 | 3 | 4;
}

export function MetricGrid({ metrics, columns = 3 }: MetricGridProps) {
  const width = `${100 / columns}%`;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {metrics.map((metric) => {
        const tone = toneStyles[metric.tone || 'default'];
        return (
          <div
            key={metric.label}
            style={{
              flex: `0 0 ${width}`,
              background: tone.bg,
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: 12,
              boxSizing: 'border-box',
            }}
          >
            <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>{metric.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 700, color: tone.color }}>
              {metric.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
