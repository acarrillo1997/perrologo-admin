import Link from "next/link";

import { AdminShell } from "../../components/admin-shell";
import { requireAdminSession } from "../../lib/admin";
import { getInbox } from "../../lib/inbox";

export default async function AdminInboxPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const query = resolvedSearchParams?.q?.trim();
  const inbox = await getInbox(query);

  return (
    <AdminShell
      title="Inbox"
      subtitle="Conversaciones de WhatsApp, usuarios y perfiles activos"
    >
      <section className="panel">
        <form className="toolbar">
          <input
            aria-label="Buscar"
            defaultValue={query}
            name="q"
            placeholder="Buscar por telefono, nombre o perro"
          />
          <button className="secondary-button" type="submit">
            Buscar
          </button>
        </form>
        <div className="inbox-list">
          {inbox.map((entry: (typeof inbox)[number]) => (
            <Link
              className="conversation-card"
              href={`/admin/owners/${entry.owner?.id}`}
              key={entry.conversation.id}
            >
              <div className="row">
                <strong>{entry.owner?.name || entry.owner?.phoneNumber || "Sin nombre"}</strong>
                <span className="pill">{entry.conversation.state}</span>
              </div>
              <div className="subtle">
                {entry.dog
                  ? `${entry.dog.name} · ${entry.dog.breed}`
                  : "Perfil de perro en onboarding"}
              </div>
              <div>{entry.latestMessage?.body || "Sin mensajes"}</div>
            </Link>
          ))}
          {inbox.length === 0 ? (
            <div className="subtle">No hay conversaciones para mostrar.</div>
          ) : null}
        </div>
      </section>
    </AdminShell>
  );
}
