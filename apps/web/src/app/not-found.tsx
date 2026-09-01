import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="standalone-page">
      <p className="eyebrow">404 / A SMALL DETOUR</p>
      <h1>This page isn’t in your notes.</h1>
      <p>The link may have changed. Your next chapter is still waiting.</p>
      <Link className="button primary" href="/app">
        Back to workspace
      </Link>
    </main>
  );
}
