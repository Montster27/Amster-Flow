import { PropsWithChildren } from 'react';

interface ReportSectionProps {
  title: string;
  description?: string;
}

export function ReportSection({ title, description, children }: PropsWithChildren<ReportSectionProps>) {
  return (
    <section style={{ marginBottom: 16, pageBreakInside: 'avoid' }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#111827' }}>
        {title}
      </h2>
      {description && (
        <p style={{ fontSize: 12, color: '#4b5563', margin: '0 0 8px' }}>{description}</p>
      )}
      <div>{children}</div>
    </section>
  );
}
