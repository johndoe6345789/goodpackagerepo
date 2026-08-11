import Link from 'next/link';
import styles from './page.module.scss';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import StatsSection from '../components/StatsSection';
import CodeSection from '../components/CodeSection';

/**
 * Home page displaying hero, features, stats, and code.
 * @returns The home page content.
 */
export default function HomePage() {
  return (
    <div
      className={styles.container}
      data-testid="home-page"
    >
      <HeroSection styles={styles} />
      <FeaturesSection styles={styles} />
      <StatsSection styles={styles} />
      <CodeSection styles={styles} />
    </div>
  );
}
