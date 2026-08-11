import stats from '../constants/stats.json';

/** Props for StatsSection. */
interface StatsSectionProps {
  /** SCSS module styles from the parent page. */
  styles: Record<string, string>;
}

/**
 * Stats row driven by stats.json.
 * @param props - Component props.
 * @returns The stats section JSX.
 */
export default function StatsSection(
  { styles }: StatsSectionProps,
) {
  return (
    <section
      className={styles.stats}
      data-testid="stats-section"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className={styles.stat}
        >
          <div className={styles.stat__value}>
            {s.value}
          </div>
          <div className={styles.stat__label}>
            {s.label}
          </div>
        </div>
      ))}
    </section>
  );
}
