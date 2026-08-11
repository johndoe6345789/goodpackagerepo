import {
  getOperationLabel, getOperationDescription,
  getOperationCategory, getCategoryColor,
} from '../../utils/operations';

/** Pipeline step shape. */
interface PipelineStep { op: string; [key: string]: unknown; }

/** Props for PipelineView. */
interface PipelineViewProps { pipeline: PipelineStep[]; styles: Record<string, string>; }

/** Displays pipeline operations in plain English. */
export default function PipelineView({ pipeline, styles }: PipelineViewProps) {
  return (
    <div style={{
      marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '16px',
    }}>
      <h4 style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
        Pipeline Operations (plain English)
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pipeline.map((step, j) => {
          const label = getOperationLabel(step.op);
          const desc = getOperationDescription(step.op);
          const cat = getOperationCategory(step.op);
          const color = getCategoryColor(cat);
          return (
            <div key={`${step.op}-${j}`} style={{
              display: 'flex', alignItems: 'start', padding: '12px',
              background: '#f9f9f9', borderRadius: '6px', borderLeft: `4px solid ${color}`,
            }}>
              <div style={{
                minWidth: '30px', height: '30px', borderRadius: '50%', background: color,
                color: 'white', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 'bold', fontSize: '14px',
                marginRight: '12px', flexShrink: 0,
              }}>{j + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
                }}>
                  <strong style={{ fontSize: '15px' }}>{label}</strong>
                  <span className={styles.badge} style={{
                    background: color, color: 'white', fontSize: '11px', padding: '2px 8px',
                  }}>{cat}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                  {desc}
                </div>
                <details style={{ fontSize: '12px', color: '#888' }}>
                  <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                    Technical details (operation: <code>{step.op}</code>)
                  </summary>
                  <div style={{
                    marginTop: '8px', padding: '8px', background: '#fff',
                    borderRadius: '4px', border: '1px solid #e0e0e0',
                  }}>
                    <pre style={{ margin: 0, fontSize: '11px', overflow: 'auto' }}>
                      {JSON.stringify(step, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
