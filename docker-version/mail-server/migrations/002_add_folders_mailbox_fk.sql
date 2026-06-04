DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'folders_mailbox_fk'
    ) THEN
        DELETE FROM folders f
        WHERE NOT EXISTS (
            SELECT 1 FROM mailboxes m WHERE m.id = f.mailbox_id
        );

        ALTER TABLE folders
        ADD CONSTRAINT folders_mailbox_fk
        FOREIGN KEY (mailbox_id)
        REFERENCES mailboxes(id)
        ON DELETE CASCADE;
    END IF;
END $$;
