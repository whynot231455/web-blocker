export function sanitizeUrl(raw: string): string {
  let url = raw.trim().toLowerCase();
  url = url.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
  if (url.startsWith('www.')) {
    url = url.substring(4);
  }
  return url;
}

export function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
  return domainRegex.test(domain);
}
