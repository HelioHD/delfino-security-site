export const attackIdPattern = /^T\d{4}(\.\d{3})?$/;

export function attackUrl(id: string): string {
  return `https://attack.mitre.org/techniques/${id.replace('.', '/')}/`;
}
