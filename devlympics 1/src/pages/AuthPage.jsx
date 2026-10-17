import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import LoginForm from "../components/LoginForm.jsx";
import RegisterStepper from "../components/RegisterStepper.jsx";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRegister = location.pathname === "/register";

  useEffect(() => {
    document.title = `${isRegister ? "Create account" : "Log in"} | Sparkmatch`;
    return () => { document.title = "Sparkmatch"; };
  }, [isRegister]);

  return (
    <main className="mx-auto grid min-h-[calc(100vh-57px)] max-w-7xl grid-cols-1 gap-8 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:py-12">
      <section className="relative overflow-hidden rounded-[2rem] border-[3px] border-ink bg-violet p-6 text-white shadow-pop sm:p-10 lg:min-h-[38rem] lg:p-12">
        <p className="mb-5 inline-flex rounded-full border-2 border-ink bg-sun px-4 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink">Build across disciplines</p>
        <h1 className="max-w-xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Great ideas need great <span className="rounded-xl bg-spark px-2 text-ink motion-safe:animate-wiggle">teammates.</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-8 text-white/90">
          Find the people who bring the skills you need, and the opportunities you can tackle together.
        </p>
        <div className="mt-8 flex flex-wrap gap-2" aria-hidden="true">
          {["🔧 Arduino", "💻 Python", "🎨 Figma", "📈 Pitching", "🧠 ML"].map((skill, index) => (
            <span className={`rounded-full border-2 border-ink px-3 py-2 text-sm font-extrabold text-ink shadow-[3px_3px_0_0_#0B0B0F] ${["bg-sun", "bg-sky", "bg-pink", "bg-spark", "bg-orange"][index]} motion-safe:animate-floaty`} key={skill}>{skill}</span>
          ))}
        </div>
        <div className="mt-8 flex items-center gap-4">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-ink bg-sun text-5xl shadow-pop-sm motion-safe:animate-floaty" aria-hidden="true">⚡</span>
          <div className="rounded-2xl border-[3px] border-ink bg-white px-4 py-3 font-bold text-ink shadow-pop-sm">Sparky says: big ideas start with a team!</div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            ["Find your complement", "Meet people who bring new skills.", "bg-spark"],
            ["Discover competitions", "Find challenges for your crew.", "bg-sun"],
            ["Build your dream team", "Mix talents and make it real.", "bg-sky"],
          ].map(([title, description, color]) => (
            <div className={`rounded-2xl border-[3px] border-ink ${color} p-4 text-ink shadow-pop-sm`} key={title}>
              <h2 className="font-extrabold">{title}</h2>
              <p className="mt-2 text-sm leading-6">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-xl rounded-[2rem] border-[3px] border-ink bg-white p-5 shadow-pop sm:p-8">
        <header className="mb-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight">{isRegister ? "Create your account" : "Welcome back"}</h2>
          <p className="mt-1 text-sm text-gray-600">{isRegister ? "Build your profile and find your people." : "Log in to find the teammates you need."}</p>
        </header>
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border-[3px] border-ink bg-cream p-1.5" role="tablist" aria-label="Account access">
          <button
            className={`rounded-xl py-3 text-center font-extrabold transition ${!isRegister ? "border-[3px] border-ink bg-spark shadow-pop-sm" : "text-gray-600"}`}
            type="button"
            role="tab"
            aria-selected={!isRegister}
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className={`rounded-xl py-3 text-center font-extrabold transition ${isRegister ? "border-[3px] border-ink bg-spark shadow-pop-sm" : "text-gray-600"}`}
            type="button"
            role="tab"
            aria-selected={isRegister}
            onClick={() => navigate("/register")}
          >
            Register
          </button>
        </div>
        {isRegister ? <RegisterStepper /> : <LoginForm />}
        {!isRegister && (
          <p className="mt-6 text-center text-sm">
            New here?{" "}
            <Link className="font-semibold underline decoration-spark decoration-2 underline-offset-4" to="/register">
              Create an account
            </Link>
          </p>
        )}
      </section>
    </main>
  );
}
