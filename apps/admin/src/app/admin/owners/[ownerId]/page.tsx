import { notFound } from "next/navigation";

import { AdminShell } from "../../../../components/admin-shell";
import { requireAdminSession } from "../../../../lib/admin";
import { getRepositories } from "../../../../lib/db";

export default async function OwnerDetailPage({
  params
}: {
  params: Promise<{ ownerId: string }>;
}) {
  await requireAdminSession();
  const { ownerId } = await params;
  const repositories = getRepositories();
  const detail = await repositories.owners.detail(ownerId);

  if (!detail) {
    notFound();
  }

  const primaryDog = detail.dogs[0];

  return (
    <AdminShell
      title={detail.owner.name || detail.owner.phoneNumber}
      subtitle={`Idioma ${detail.owner.language} · ${detail.owner.phoneNumber}`}
    >
      <div className="columns">
        <section className="stack">
          <div className="panel stack">
            <h2>Flags internas</h2>
            <form
              action={`/api/admin/owners/${detail.owner.id}/flags`}
              className="stack"
              method="post"
            >
              <label className="field">
                <span>Necesita seguimiento</span>
                <select
                  defaultValue={String(detail.owner.needsFollowUp)}
                  name="needsFollowUp"
                >
                  <option value="false">No</option>
                  <option value="true">Si</option>
                </select>
              </label>
              <label className="field">
                <span>Bloqueado</span>
                <select defaultValue={String(detail.owner.blocked)} name="blocked">
                  <option value="false">No</option>
                  <option value="true">Si</option>
                </select>
              </label>
              <button className="primary-button" type="submit">
                Guardar flags
              </button>
            </form>
          </div>

          <div className="panel stack">
            <h2>Perfil del perro</h2>
            {primaryDog ? (
              <form
                action={`/api/admin/owners/${detail.owner.id}/dogs/${primaryDog.id}`}
                className="stack"
                method="post"
              >
                <label className="field">
                  <span>Nombre</span>
                  <input defaultValue={primaryDog.name} name="name" required />
                </label>
                <label className="field">
                  <span>Raza</span>
                  <input defaultValue={primaryDog.breed} name="breed" required />
                </label>
                <label className="field">
                  <span>Edad</span>
                  <input defaultValue={primaryDog.age} name="age" required />
                </label>
                <label className="field">
                  <span>Peso</span>
                  <input defaultValue={primaryDog.weight} name="weight" required />
                </label>
                <label className="field">
                  <span>Sexo</span>
                  <input defaultValue={primaryDog.sex ?? ""} name="sex" />
                </label>
                <label className="field">
                  <span>Esterilizado</span>
                  <select
                    defaultValue={
                      primaryDog.neutered === null ? "unknown" : String(primaryDog.neutered)
                    }
                    name="neutered"
                  >
                    <option value="unknown">No se</option>
                    <option value="true">Si</option>
                    <option value="false">No</option>
                  </select>
                </label>
                <button className="primary-button" type="submit">
                  Guardar perfil
                </button>
              </form>
            ) : (
              <p className="subtle">Todavia no existe un perro guardado.</p>
            )}
          </div>
        </section>

        <section className="stack">
          <div className="panel stack">
            <h2>Eventos de seguridad</h2>
            {detail.safetyEvents.length > 0 ? (
              detail.safetyEvents.map((event: (typeof detail.safetyEvents)[number]) => (
                <div className="message-card" key={event.id}>
                  <strong>{event.severity.toUpperCase()}</strong>
                  <p>{event.summary}</p>
                  <p className="subtle">{event.matchedSignals.join(", ")}</p>
                </div>
              ))
            ) : (
              <p className="subtle">Sin eventos de seguridad registrados.</p>
            )}
          </div>

          <div className="panel stack">
            <h2>Historial de mensajes</h2>
            <div className="message-list">
              {detail.messages.map((message: (typeof detail.messages)[number]) => (
                <div className="message-card" data-role={message.role} key={message.id}>
                  <div className="row">
                    <strong>{message.role === "assistant" ? "Perrologo" : "Usuario"}</strong>
                    <span className="subtle">
                      {new Date(message.createdAt).toLocaleString("es-CO")}
                    </span>
                  </div>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
