import { redirect } from "next/navigation";

import { getAuthenticatedUser, signInWithPassword } from "../../lib/auth";

export default async function LoginPage() {
  const session = await getAuthenticatedUser();

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="login-shell">
      <section className="login-card stack">
        <div>
          <p className="eyebrow">Perrologo</p>
          <h1>Admin dashboard</h1>
          <p className="subtle">
            Acceso solo para correos aprobados. Inicia sesion con email y password.
          </p>
        </div>
        <form action={signInWithPassword} className="stack">
          <label className="field">
            <span>Email</span>
            <input autoComplete="email" name="email" required type="email" />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
            />
          </label>
          <button className="primary-button" type="submit">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}
