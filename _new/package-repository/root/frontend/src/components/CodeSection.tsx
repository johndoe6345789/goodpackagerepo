/** Props for CodeSection. */
interface CodeSectionProps {
  /** SCSS module styles from the parent page. */
  styles: Record<string, string>;
}

const CODE_EXAMPLE = `# Install a package
curl -H "Authorization: Bearer $TOKEN" \\
  https://repo.example.com/v1/acme/myapp/1.0.0/linux-amd64/blob \\
  -o myapp.tar.gz

# Publish a package
curl -X PUT \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/octet-stream" \\
  --data-binary @myapp.tar.gz \\
  https://repo.example.com/v1/acme/myapp/1.0.0/linux-amd64/blob`;

/**
 * Code example section showing CLI usage.
 * @param props - Component props.
 * @returns The code section JSX.
 */
export default function CodeSection(
  { styles }: CodeSectionProps,
) {
  return (
    <section
      className={styles.code}
      data-testid="code-section"
    >
      <pre><code>{CODE_EXAMPLE}</code></pre>
    </section>
  );
}
