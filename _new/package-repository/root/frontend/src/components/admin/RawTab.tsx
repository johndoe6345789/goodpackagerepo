import type { AdminConfig } from '../../types/admin';

/** Props for RawTab. */
interface RawTabProps {
  config: AdminConfig;
  styles: Record<string, string>;
}

/**
 * Raw JSON data tab for admin config inspection.
 * @param props - Component props.
 * @returns The raw data tab JSX.
 */
export default function RawTab({
  config,
  styles,
}: RawTabProps) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(
      JSON.stringify(config, null, 2),
    );
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.section__title}>
        Raw Configuration Data
        <button
          className={
            `${styles.button}`
            + ` ${styles['button--secondary']}`
            + ` ${styles['button--small']}`
          }
          onClick={handleCopy}
          aria-label="Copy configuration to clipboard"
        >
          Copy to Clipboard
        </button>
      </h2>
      <div className={styles.section__content}>
        <div className={styles.codeBlock}>
          <pre>
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
