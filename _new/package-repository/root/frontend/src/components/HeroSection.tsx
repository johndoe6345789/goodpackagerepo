import Link from 'next/link';

/** Props for HeroSection. */
interface HeroSectionProps {
  /** SCSS module styles from the parent page. */
  styles: Record<string, string>;
}

/**
 * Hero banner with title, subtitle, and CTA buttons.
 * @param props - Component props.
 * @returns The hero section JSX.
 */
export default function HeroSection(
  { styles }: HeroSectionProps,
) {
  return (
    <section
      className={styles.hero}
      data-testid="hero-section"
    >
      <h1 className={styles.hero__title}>
        Welcome to Good Package Repo
      </h1>
      <p className={styles.hero__subtitle}>
        The world&apos;s first truly good package
        repository
      </p>
      <div className={styles.hero__actions}>
        <Link
          href="/browse"
          className={
            `${styles.button}`
            + ` ${styles['button--primary']}`
          }
        >
          Browse Packages
        </Link>
        <Link
          href="/docs"
          className={
            `${styles.button}`
            + ` ${styles['button--secondary']}`
          }
        >
          Read Docs
        </Link>
      </div>
    </section>
  );
}
