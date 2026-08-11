import type { PackageInfo, PackageVersion } from '../types/package';

/** Props for VersionTable. */
interface VersionTableProps {
  versions: PackageVersion[];
  detail: PackageInfo;
  styles: Record<string, string>;
  onDownload: (pkg: PackageInfo) => void;
}

const TH = { textAlign: 'left' as const, padding: '8px', borderBottom: '1px solid #ddd' };
const TD = { padding: '8px' };

/** Table of package versions with download buttons. */
export default function VersionTable({
  versions, detail, styles, onDownload,
}: VersionTableProps) {
  if (versions.length === 0) return <p>No versions found</p>;
  const btnCls = `${styles.button} ${styles['button--primary']} ${styles['button--small']}`;

  return (
    <div data-testid="version-table">
      <h3>Versions</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={TH}>Version</th>
            <th style={TH}>Variant</th>
            <th style={{ ...TH, textAlign: 'right' }}>Size</th>
            <th style={{ ...TH, textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v) => (
            <tr key={`${v.version}-${v.variant}`}>
              <td style={TD}>{v.version}</td>
              <td style={TD}>{v.variant}</td>
              <td style={{ ...TD, textAlign: 'right' }}>
                {(v.blob_size / 1024).toFixed(1)} KB
              </td>
              <td style={{ ...TD, textAlign: 'right' }}>
                <button className={btnCls} onClick={() => onDownload({
                  ...detail, version: v.version, variant: v.variant,
                })}>
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: '16px', fontSize: '13px', color: '#888' }}>
        Digest: {versions[0]?.blob_digest ?? 'N/A'}
      </div>
    </div>
  );
}
