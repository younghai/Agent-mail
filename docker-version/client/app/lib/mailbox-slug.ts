export function encodeMailboxSlug(email: string): string {
  return btoa(email).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeMailboxSlug(slug: string): string {
  const padded = slug + '='.repeat((4 - (slug.length % 4)) % 4);
  return atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
}
