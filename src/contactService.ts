import { db } from "./db";

export interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: "primary" | "secondary";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface IdentifyInput {
  email?: string | null;
  phoneNumber?: string | null;
}

export interface IdentifyResponse {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

const selectContactsStmt = db.prepare<Contact[]>(
  `SELECT id, phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt
   FROM Contact
   WHERE (email = @email OR phoneNumber = @phoneNumber)
     AND (deletedAt IS NULL)`
);

const selectByIdsStmt = db.prepare<Contact[]>(
  `SELECT id, phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt
   FROM Contact
   WHERE id IN ($ids)
     AND (deletedAt IS NULL)`
);

const insertContactStmt = db.prepare<
  Pick<
    Contact,
    "phoneNumber" | "email" | "linkedId" | "linkPrecedence" | "createdAt" | "updatedAt" | "deletedAt"
  >
>(`
  INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt)
  VALUES (@phoneNumber, @email, @linkedId, @linkPrecedence, @createdAt, @updatedAt, @deletedAt)
`);

const updateContactLinkStmt = db.prepare<{ id: number; linkedId: number; linkPrecedence: string; updatedAt: string }>(
  `
  UPDATE Contact
  SET linkedId = @linkedId,
      linkPrecedence = @linkPrecedence,
      updatedAt = @updatedAt
  WHERE id = @id
`
);

export function identify(input: IdentifyInput): IdentifyResponse {
  const email = input.email ?? null;
  const phoneNumber = input.phoneNumber ?? null;

  if (!email && !phoneNumber) {
    throw new Error("Either email or phoneNumber must be provided");
  }

  const now = new Date().toISOString();

  const initialMatches = selectContactsStmt.all({
    email,
    phoneNumber,
  } as any) as unknown as Contact[];

  if (initialMatches.length === 0) {
    const info = insertContactStmt.run({
      phoneNumber,
      email,
      linkedId: null,
      linkPrecedence: "primary",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    const id = Number(info.lastInsertRowid);

    return {
      primaryContactId: id,
      emails: email ? [email] : [],
      phoneNumbers: phoneNumber ? [phoneNumber] : [],
      secondaryContactIds: [],
    };
  }

  const allContactsMap = new Map<number, Contact>();

  for (const c of initialMatches) {
    allContactsMap.set(c.id, c);
    if (c.linkedId) {
      const linked = db
        .prepare<Contact>(
          `SELECT id, phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt
           FROM Contact
           WHERE id = ? AND deletedAt IS NULL`
        )
        .get(c.linkedId) as Contact | undefined;
      if (linked) {
        allContactsMap.set(linked.id, linked);
      }
    }
  }

  let changed = true;
  while (changed) {
    changed = false;
    const ids = Array.from(allContactsMap.keys());
    if (ids.length === 0) break;

    const placeholders = ids.map(() => "?").join(",");
    const stmt = db.prepare<Contact[]>(
      `SELECT id, phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt, deletedAt
       FROM Contact
       WHERE (id IN (${placeholders}) OR linkedId IN (${placeholders}))
         AND deletedAt IS NULL`
    );
    const rows = stmt.all(...ids, ...ids) as unknown as Contact[];
    for (const row of rows) {
      if (!allContactsMap.has(row.id)) {
        allContactsMap.set(row.id, row);
        changed = true;
      }
    }
  }

  const allContacts = Array.from(allContactsMap.values());

  let primary = allContacts
    .filter((c) => c.linkPrecedence === "primary")
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];

  if (!primary) {
    primary = allContacts.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];
  }

  const tx = db.transaction(() => {
    for (const contact of allContacts) {
      if (contact.id === primary.id) continue;
      if (contact.linkPrecedence !== "secondary" || contact.linkedId !== primary.id) {
        updateContactLinkStmt.run({
          id: contact.id,
          linkedId: primary.id,
          linkPrecedence: "secondary",
          updatedAt: now,
        });
        contact.linkPrecedence = "secondary";
        contact.linkedId = primary.id;
        contact.updatedAt = now;
      }
    }

    const existingEmails = new Set(
      allContacts.filter((c) => c.email).map((c) => c.email as string)
    );
    const existingPhones = new Set(
      allContacts.filter((c) => c.phoneNumber).map((c) => c.phoneNumber as string)
    );

    let newSecondaryId: number | null = null;

    const needNewEmail = email && !existingEmails.has(email);
    const needNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

    if (needNewEmail || needNewPhone) {
      const info = insertContactStmt.run({
        phoneNumber,
        email,
        linkedId: primary.id,
        linkPrecedence: "secondary",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
      newSecondaryId = Number(info.lastInsertRowid);
      allContacts.push({
        id: newSecondaryId,
        phoneNumber,
        email,
        linkedId: primary.id,
        linkPrecedence: "secondary",
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });
    }

    const emailsSet = new Set<string>();
    const phonesSet = new Set<string>();
    const secondaryIds: number[] = [];

    for (const c of allContacts) {
      if (c.email) emailsSet.add(c.email);
      if (c.phoneNumber) phonesSet.add(c.phoneNumber);
      if (c.id !== primary.id && c.linkPrecedence === "secondary") {
        secondaryIds.push(c.id);
      }
    }

    const emails = Array.from(emailsSet);
    const phones = Array.from(phonesSet);

    emails.sort();
    phones.sort();
    if (primary.email) {
      emails.sort((a, b) => {
        if (a === primary.email) return -1;
        if (b === primary.email) return 1;
        return a.localeCompare(b);
      });
    }
    if (primary.phoneNumber) {
      phones.sort((a, b) => {
        if (a === primary.phoneNumber) return -1;
        if (b === primary.phoneNumber) return 1;
        return a.localeCompare(b);
      });
    }

    secondaryIds.sort((a, b) => a - b);

    return {
      primaryContactId: primary.id,
      emails,
      phoneNumbers: phones,
      secondaryContactIds: secondaryIds,
    };
  });

  return tx() as IdentifyResponse;
}

