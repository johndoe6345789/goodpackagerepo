import type { Entity } from '../../types/admin';
import EntityCard from './EntityCard';

/** Props for EntitiesTab. */
interface EntitiesTabProps { entities: Entity[]; styles: Record<string, string>; }

/** Entities tab showing entity definitions. */
export default function EntitiesTab({ entities, styles }: EntitiesTabProps) {
  const btnCls = `${styles.button} ${styles['button--primary']} ${styles['button--small']}`;

  return (
    <div className={styles.section}>
      <h2 className={styles.section__title}>
        Entities <button className={btnCls}>+ Add Entity</button>
      </h2>
      <div className={styles.section__content}>
        {entities.length > 0 ? entities.map((e) => (
          <EntityCard key={e.name} entity={e} styles={styles} />
        )) : (
          <div className={styles.empty}>
            <div className={styles.empty__icon}>{'\uD83D\uDCE6'}</div>
            <p>No entities defined</p>
          </div>
        )}
      </div>
    </div>
  );
}
