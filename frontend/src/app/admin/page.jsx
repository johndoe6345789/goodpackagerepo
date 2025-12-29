'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.scss';
import { getOperationLabel, getOperationDescription, getOperationCategory, getCategoryColor } from '../../utils/operations';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [expandedRoute, setExpandedRoute] = useState(null);

  useEffect(() => {
    // Check if user is logged in and has admin scope
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (!parsedUser.scopes?.includes('admin')) {
      router.push('/');
      return;
    }
    
    setUser(parsedUser);
    
    // Fetch configuration
    fetchConfig();
  }, [router]);

  const fetchConfig = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/admin/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      } else {
        console.error('Failed to fetch config');
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !user || !config) {
    return <div className={styles.loading}>Loading admin panel...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Admin Panel</h1>
          <p>Repository configuration and management</p>
        </div>
        <div className={styles.header__actions}>
          <button className={`${styles.button} ${styles['button--secondary']}`}>
            Export Config
          </button>
          <button className={`${styles.button} ${styles['button--primary']}`}>
            Save Changes
          </button>
        </div>
      </div>

      <div className={styles.alert} style={{ background: 'rgba(33, 150, 243, 0.1)', borderLeft: '4px solid #2196f3' }}>
        ℹ️ <strong>Info:</strong> Configuration loaded from SQLite database. Changes are stored in real-time.
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'overview' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'entities' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('entities')}
        >
          Entities
        </button>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'storage' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('storage')}
        >
          Storage
        </button>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'routes' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          API Routes
        </button>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'auth' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          Auth & Policies
        </button>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'features' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
        <button
          className={`${styles.tabs__tab} ${activeTab === 'raw' ? styles['tabs__tab--active'] : ''}`}
          onClick={() => setActiveTab('raw')}
        >
          Raw Data
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className={styles.section}>
            <h2 className={styles.section__title}>Repository Information</h2>
            <div className={styles.section__content}>
              <div className={styles.grid}>
                <div className={styles.stat}>
                  <div className={styles.stat__icon}>📋</div>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Schema Version</div>
                    <div className={styles.stat__value}>{config.schema_version}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__icon}>🔧</div>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Type ID</div>
                    <div className={styles.stat__value} style={{ fontSize: '14px' }}>{config.type_id}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__icon}>🛣️</div>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>API Routes</div>
                    <div className={styles.stat__value}>{config.api_routes?.length || 0}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__icon}>📦</div>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Entities</div>
                    <div className={styles.stat__value}>{config.entities?.length || 0}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__icon}>💾</div>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Blob Stores</div>
                    <div className={styles.stat__value}>{config.blob_stores?.length || 0}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__icon}>🔐</div>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Auth Scopes</div>
                    <div className={styles.stat__value}>{config.auth_scopes?.length || 0}</div>
                  </div>
                </div>
              </div>
              <p style={{ marginTop: '24px', color: '#666' }}>{config.description}</p>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.section__title}>Capabilities</h2>
            <div className={styles.section__content}>
              {config.capabilities && (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Protocols:</strong>{' '}
                    {JSON.parse(config.capabilities.protocols || '[]').map((p, i) => (
                      <span key={i} className={`${styles.badge} ${styles['badge--primary']}`}>
                        {p}
                      </span>
                    ))}
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <strong>Storage:</strong>{' '}
                    {JSON.parse(config.capabilities.storage || '[]').map((s, i) => (
                      <span key={i} className={`${styles.badge} ${styles['badge--primary']}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div>
                    <strong>Features:</strong>{' '}
                    {JSON.parse(config.capabilities.features || '[]').map((f, i) => (
                      <span key={i} className={`${styles.badge} ${styles['badge--success']}`}>
                        {f}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'entities' && (
        <div className={styles.section}>
          <h2 className={styles.section__title}>
            Entities
            <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
              + Add Entity
            </button>
          </h2>
          <div className={styles.section__content}>
            {config.entities && config.entities.length > 0 ? (
              config.entities.map((entity, i) => (
                <div key={i} className={styles.entityCard}>
                  <div className={styles.entityCard__header}>
                    <div>
                      <div className={styles.entityCard__name}>{entity.name}</div>
                      <div className={styles.entityCard__details}>
                        Type: {entity.type} • Fields: {entity.fields?.length || 0} • Constraints: {entity.constraints?.length || 0}
                      </div>
                    </div>
                    <div className={styles.entityCard__actions}>
                      <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                        Edit
                      </button>
                      <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {entity.fields && entity.fields.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Fields</h4>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Optional</th>
                            <th>Normalizations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entity.fields.map((field, j) => (
                            <tr key={j}>
                              <td><strong>{field.name}</strong></td>
                              <td>{field.type}</td>
                              <td>{field.optional ? '✓' : '✗'}</td>
                              <td>{JSON.parse(field.normalizations || '[]').join(', ') || 'none'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  
                  {entity.constraints && entity.constraints.length > 0 && (
                    <>
                      <h4 style={{ marginTop: '16px', marginBottom: '8px' }}>Constraints</h4>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>Field</th>
                            <th>Pattern</th>
                            <th>When Present</th>
                          </tr>
                        </thead>
                        <tbody>
                          {entity.constraints.map((constraint, j) => (
                            <tr key={j}>
                              <td><strong>{constraint.field}</strong></td>
                              <td><code>{constraint.regex}</code></td>
                              <td>{constraint.when_present ? '✓' : '✗'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                <div className={styles.empty__icon}>📦</div>
                <p>No entities defined</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'storage' && (
        <>
          <div className={styles.section}>
            <h2 className={styles.section__title}>
              Blob Stores
              <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
                + Add Store
              </button>
            </h2>
            <div className={styles.section__content}>
              {config.blob_stores && config.blob_stores.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Kind</th>
                      <th>Root</th>
                      <th>Addressing Mode</th>
                      <th>Max Size</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.blob_stores.map((store, i) => (
                      <tr key={i}>
                        <td><strong>{store.name}</strong></td>
                        <td>{store.kind}</td>
                        <td><code>{store.root}</code></td>
                        <td>{store.addressing_mode}</td>
                        <td>{store.max_blob_bytes ? `${(store.max_blob_bytes / 1024 / 1024).toFixed(0)} MB` : 'N/A'}</td>
                        <td>
                          <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.empty__icon}>💾</div>
                  <p>No blob stores defined</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.section__title}>
              KV Stores
              <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
                + Add Store
              </button>
            </h2>
            <div className={styles.section__content}>
              {config.kv_stores && config.kv_stores.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Kind</th>
                      <th>Root</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.kv_stores.map((store, i) => (
                      <tr key={i}>
                        <td><strong>{store.name}</strong></td>
                        <td>{store.kind}</td>
                        <td><code>{store.root}</code></td>
                        <td>
                          <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.empty__icon}>🗄️</div>
                  <p>No KV stores defined</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'routes' && (
        <div className={styles.section}>
          <h2 className={styles.section__title}>
            API Routes
            <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
              + Add Route
            </button>
          </h2>
          <div className={styles.section__content}>
            {config.api_routes && config.api_routes.length > 0 ? (
              config.api_routes.map((route, i) => {
                const pipeline = JSON.parse(route.pipeline || '[]');
                const isExpanded = expandedRoute === i;
                
                return (
                  <div key={i} className={styles.entityCard} style={{ marginBottom: '16px' }}>
                    <div className={styles.entityCard__header}>
                      <div style={{ flex: 1 }}>
                        <div className={styles.entityCard__name}>{route.route_id}</div>
                        <div className={styles.entityCard__details}>
                          <span className={`${styles.badge} ${styles['badge--primary']}`}>
                            {route.method}
                          </span>
                          {' '}
                          <code>{route.path}</code>
                          {' • '}
                          {JSON.parse(route.tags || '[]').map((tag, j) => (
                            <span key={j} className={`${styles.badge} ${styles['badge--success']}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={styles.entityCard__actions}>
                        <button 
                          className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}
                          onClick={() => setExpandedRoute(isExpanded ? null : i)}
                        >
                          {isExpanded ? '▼ Hide' : '▶ View'} Pipeline ({pipeline.length} steps)
                        </button>
                        <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                          Edit
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && pipeline.length > 0 && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
                        <h4 style={{ marginBottom: '12px', color: '#666', fontSize: '14px' }}>
                          Pipeline Operations (showing in plain English)
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {pipeline.map((step, j) => {
                            const operation = step.op;
                            const label = getOperationLabel(operation);
                            const description = getOperationDescription(operation);
                            const category = getOperationCategory(operation);
                            const categoryColor = getCategoryColor(category);
                            
                            return (
                              <div 
                                key={j} 
                                style={{ 
                                  display: 'flex',
                                  alignItems: 'start',
                                  padding: '12px',
                                  background: '#f9f9f9',
                                  borderRadius: '6px',
                                  borderLeft: `4px solid ${categoryColor}`
                                }}
                              >
                                <div style={{ 
                                  minWidth: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  background: categoryColor,
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  marginRight: '12px',
                                  flexShrink: 0
                                }}>
                                  {j + 1}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: '15px' }}>{label}</strong>
                                    <span 
                                      className={styles.badge}
                                      style={{ 
                                        background: categoryColor, 
                                        color: 'white',
                                        fontSize: '11px',
                                        padding: '2px 8px'
                                      }}
                                    >
                                      {category}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                                    {description}
                                  </div>
                                  <details style={{ fontSize: '12px', color: '#888' }}>
                                    <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
                                      Technical details (operation: <code>{operation}</code>)
                                    </summary>
                                    <div style={{ 
                                      marginTop: '8px',
                                      padding: '8px',
                                      background: '#fff',
                                      borderRadius: '4px',
                                      border: '1px solid #e0e0e0'
                                    }}>
                                      <pre style={{ 
                                        margin: 0,
                                        fontSize: '11px',
                                        overflow: 'auto'
                                      }}>
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
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.empty}>
                <div className={styles.empty__icon}>🛣️</div>
                <p>No API routes defined</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'auth' && (
        <>
          <div className={styles.section}>
            <h2 className={styles.section__title}>
              Scopes
              <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
                + Add Scope
              </button>
            </h2>
            <div className={styles.section__content}>
              {config.auth_scopes && config.auth_scopes.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Scope</th>
                      <th>Actions</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.auth_scopes.map((scope, i) => (
                      <tr key={i}>
                        <td><strong>{scope.name}</strong></td>
                        <td>{JSON.parse(scope.actions || '[]').join(', ')}</td>
                        <td>
                          <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.empty}>
                  <div className={styles.empty__icon}>🔐</div>
                  <p>No auth scopes defined</p>
                </div>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.section__title}>
              Policies
              <button className={`${styles.button} ${styles['button--primary']} ${styles['button--small']}`}>
                + Add Policy
              </button>
            </h2>
            <div className={styles.section__content}>
              {config.auth_policies && config.auth_policies.length > 0 ? (
                config.auth_policies.map((policy, i) => (
                  <div key={i} className={styles.entityCard}>
                    <div className={styles.entityCard__header}>
                      <div>
                        <div className={styles.entityCard__name}>{policy.name}</div>
                        <div className={styles.entityCard__details}>
                          Effect: {policy.effect}
                        </div>
                      </div>
                      <div className={styles.entityCard__actions}>
                        <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                          Edit
                        </button>
                        <button className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}>
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className={styles.codeBlock}>
                      <pre>{JSON.stringify({
                        conditions: JSON.parse(policy.conditions || '{}'),
                        requirements: JSON.parse(policy.requirements || '{}')
                      }, null, 2)}</pre>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.empty}>
                  <div className={styles.empty__icon}>📜</div>
                  <p>No policies defined</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'features' && (
        <div className={styles.section}>
          <h2 className={styles.section__title}>Features Configuration</h2>
          <div className={styles.section__content}>
            {config.features && (
              <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className={styles.stat}>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Mutable Tags</div>
                    <div className={styles.stat__value}>{config.features.mutable_tags ? '✓ Enabled' : '✗ Disabled'}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Allow Overwrite Artifacts</div>
                    <div className={styles.stat__value}>{config.features.allow_overwrite_artifacts ? '✓ Enabled' : '✗ Disabled'}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Proxy Enabled</div>
                    <div className={styles.stat__value}>{config.features.proxy_enabled ? '✓ Enabled' : '✗ Disabled'}</div>
                  </div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.stat__info}>
                    <div className={styles.stat__label}>Garbage Collection</div>
                    <div className={styles.stat__value}>{config.features.gc_enabled ? '✓ Enabled' : '✗ Disabled'}</div>
                  </div>
                </div>
              </div>
            )}
            
            {config.caching && (
              <>
                <h3 style={{ marginTop: '32px', marginBottom: '16px' }}>Caching</h3>
                <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className={styles.stat}>
                    <div className={styles.stat__info}>
                      <div className={styles.stat__label}>Response Cache</div>
                      <div className={styles.stat__value}>{config.caching.response_cache_enabled ? '✓ Enabled' : '✗ Disabled'}</div>
                    </div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.stat__info}>
                      <div className={styles.stat__label}>Response Cache TTL</div>
                      <div className={styles.stat__value}>{config.caching.response_cache_ttl}s</div>
                    </div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.stat__info}>
                      <div className={styles.stat__label}>Blob Cache</div>
                      <div className={styles.stat__value}>{config.caching.blob_cache_enabled ? '✓ Enabled' : '✗ Disabled'}</div>
                    </div>
                  </div>
                  <div className={styles.stat}>
                    <div className={styles.stat__info}>
                      <div className={styles.stat__label}>Blob Cache Max Size</div>
                      <div className={styles.stat__value}>{config.caching.blob_cache_max_bytes ? `${(config.caching.blob_cache_max_bytes / 1024 / 1024 / 1024).toFixed(0)} GB` : 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {activeTab === 'raw' && (
        <div className={styles.section}>
          <h2 className={styles.section__title}>
            Raw Configuration Data
            <button
              className={`${styles.button} ${styles['button--secondary']} ${styles['button--small']}`}
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                alert('Configuration copied to clipboard!');
              }}
            >
              Copy to Clipboard
            </button>
          </h2>
          <div className={styles.section__content}>
            <div className={styles.codeBlock}>
              <pre>{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
