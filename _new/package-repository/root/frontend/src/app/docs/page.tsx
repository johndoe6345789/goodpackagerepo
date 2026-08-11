import styles from './page.module.scss';
import DocsGettingStarted
  from '../../components/DocsGettingStarted';
import DocsApiUsage
  from '../../components/DocsApiUsage';
import DocsSchema from '../../components/DocsSchema';

/**
 * Documentation page with usage guides.
 * @returns The docs page content.
 */
export default function DocsPage() {
  return (
    <div
      className={styles.container}
      data-testid="docs-page"
    >
      <div className={styles.header}>
        <h1>Documentation</h1>
        <p>Complete guide to using the Package Repo</p>
      </div>

      <div className={styles.toc}>
        <h2>Table of Contents</h2>
        <ul>
          <li>
            <a href="#getting-started">
              Getting Started
            </a>
          </li>
          <li>
            <a href="#api-usage">API Usage</a>
          </li>
          <li>
            <a href="#schema">
              Schema Configuration
            </a>
          </li>
        </ul>
      </div>

      <div className={styles.content}>
        <DocsGettingStarted />
        <DocsApiUsage />
        <DocsSchema />
      </div>
    </div>
  );
}
