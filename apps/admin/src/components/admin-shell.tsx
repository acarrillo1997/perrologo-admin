import Link from "next/link";

import { signOutUser } from "../lib/auth";

export function AdminShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Perrologo</p>
          <h1>Admin</h1>
        </div>
        <nav className="nav">
          <Link href="/admin">Inbox</Link>
        </nav>
        <form
          action={async () => {
            "use server";
            await signOutUser();
          }}
        >
          <button className="secondary-button" type="submit">
            Cerrar sesion
          </button>
        </form>
      </aside>
      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">{title}</p>
            {subtitle ? <p className="subtle">{subtitle}</p> : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
