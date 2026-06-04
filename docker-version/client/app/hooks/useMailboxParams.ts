import { useParams } from 'react-router';
import { decodeMailboxSlug } from '~/lib/mailbox-slug';

export function useMailboxParams() {
  const { mailboxId: mailboxSlug } = useParams<{ mailboxId: string }>();
  return {
    mailboxSlug,
    mailboxId: mailboxSlug ? decodeMailboxSlug(mailboxSlug) : undefined,
  };
}
