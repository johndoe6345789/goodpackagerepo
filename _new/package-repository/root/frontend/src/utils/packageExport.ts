import type { RepoType } from '../types/admin';

/** Export repo types as a downloadable JSON package. */
export function exportTypesPackage(types: RepoType[]) {
  const payload = { version: '1.0', types };
  const blob = new Blob(
    [JSON.stringify(payload, null, 2)],
    { type: 'application/json' },
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'repo-types-package.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

/** Read a JSON file and return parsed repo types. */
export function readTypesFile(
  file: File,
  onResult: (types: RepoType[]) => void,
) {
  const reader = new FileReader();
  reader.onload = () => {
    const data = JSON.parse(reader.result as string) as {
      types?: RepoType[];
    };
    if (data.types) onResult(data.types);
  };
  reader.readAsText(file);
}
