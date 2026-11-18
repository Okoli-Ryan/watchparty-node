// The slim header on the legal pages: the wordmark back to the home page, and links between the two pages.
export default function LegalBar() {
  return (
    <header className="legal__bar">
      <div className="wrap legal__barin">
        <a className="nav__logo" href="/">WatchParty Sync</a>
        <nav aria-label="Legal">
          <a href="/privacy">Privacy</a>
          <a href="/terms">Terms</a>
        </nav>
      </div>
    </header>
  );
}
