/**
 * Schema Configuration documentation section.
 * @returns The schema docs JSX.
 */
export default function DocsSchema() {
  return (
    <>
      <h2 id="schema">Schema Configuration</h2>
      <p>
        The repository uses a declarative schema stored
        in PostgreSQL to define its behavior:
      </p>
      <ul>
        <li>
          <strong>Entities</strong>: Data models with
          validation and normalization rules
        </li>
        <li>
          <strong>Storage</strong>: Content-addressed
          blob stores with SHA256 verification
        </li>
        <li>
          <strong>Auth</strong>: Scope-based permissions
          (read, write, admin)
        </li>
        <li>
          <strong>Features</strong>: Mutable tags,
          overwrite control, proxy support
        </li>
        <li>
          <strong>Events</strong>: Append-only audit log
          for artifact lifecycle
        </li>
      </ul>
      <p>
        View the full schema configuration in the Admin
        panel or at the <code>/schema</code> endpoint.
      </p>
    </>
  );
}
