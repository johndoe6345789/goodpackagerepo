import features from
  '../constants/features.json';

/** Props for FeaturesSection. */
interface FeaturesSectionProps {
  /** SCSS module styles from the parent page. */
  styles: Record<string, string>;
}

/**
 * Features grid driven by features.json.
 * @param props - Component props.
 * @returns The features section JSX.
 */
export default function FeaturesSection(
  { styles }: FeaturesSectionProps,
) {
  return (
    <section
      className={styles.features}
      data-testid="features-section"
    >
      {features.map((f) => (
        <div
          key={f.title}
          className={styles.feature}
        >
          <div className={styles.feature__icon}>
            {f.icon}
          </div>
          <h3 className={styles.feature__title}>
            {f.title}
          </h3>
          <p
            className={
              styles.feature__description
            }
          >
            {f.description}
          </p>
        </div>
      ))}
    </section>
  );
}
