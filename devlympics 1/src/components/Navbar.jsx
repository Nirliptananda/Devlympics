import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import HUD from "./HUD.jsx";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/opportunities", label: "Opportunities" },
  { to: "/me", label: "My Profile" },
];

export default function Navbar() {
  const { token, logoutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-10 border-b-[3px] border-ink bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3" aria-label="Main navigation">
        <Link className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight" to="/">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border-[3px] border-ink bg-spark text-lg shadow-[2px_2px_0_0_#0B0B0F]" aria-hidden="true">⚡</span>
          <span>Sparkmatch</span>
        </Link>
        {token && (
          <div className="flex items-center gap-2 md:gap-5">
            <div className="hidden items-center gap-7 md:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `border-b-[3px] py-4 text-sm font-bold ${isActive ? "border-spark" : "border-transparent"}`}
                >
                  {item.label}
                </NavLink>
              ))}
              <button className="rounded-xl border-[3px] border-ink bg-white px-4 py-2 text-sm font-extrabold shadow-pop-sm transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:bg-sun" type="button" onClick={logoutUser}>
                Log out
              </button>
            </div>
            <HUD />
            <button
              className="rounded-xl border-[3px] border-ink bg-white p-2 shadow-pop-sm md:hidden"
              type="button"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        )}
      </nav>
      {token && menuOpen && (
        <nav className="absolute left-0 right-0 border-b-[3px] border-ink bg-white px-5 pb-4 shadow-pop md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `block border-b-[3px] py-3 text-sm font-medium ${isActive ? "border-spark" : "border-transparent"}`}
            >
              {item.label}
            </NavLink>
          ))}
          <button className="mt-3 w-full rounded-xl border-[3px] border-ink bg-white px-4 py-2 text-sm font-extrabold shadow-pop-sm" type="button" onClick={logoutUser}>
            Log out
          </button>
        </nav>
      )}
    </header>
  );
}
