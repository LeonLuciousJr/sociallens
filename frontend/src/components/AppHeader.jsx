export default function AppHeader({ session, screen, navigate, onSignOut }) {
  return (
    <header className="app-header">
      <a className="brand" href="#feed" onClick={(event) => { event.preventDefault(); navigate('feed') }}>
        <span className="brand-mark" aria-hidden="true">s</span>SocialLens<span className="brand-dot">.</span>
      </a>
      <nav aria-label="Main navigation">
        <button className={`nav-link ${screen === 'feed' ? 'active' : ''}`} aria-current={screen === 'feed' ? 'page' : undefined} onClick={() => navigate('feed')}>Public feed</button>
        {session ? <>
          <button className="button" onClick={() => navigate('compose')}>Write a post <span aria-hidden="true">↗</span></button>
          <button className="nav-link" onClick={onSignOut}>Sign out</button>
        </> : <>
          <button className="nav-link" onClick={() => navigate('login')}>Log in</button>
          <button className="button" onClick={() => navigate('register')}>Join SocialLens <span aria-hidden="true">↗</span></button>
        </>}
      </nav>
    </header>
  )
}
