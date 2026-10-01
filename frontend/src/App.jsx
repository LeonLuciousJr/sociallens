import { useCallback, useState } from 'react'
import AuthProvider from './auth/AuthProvider.jsx'
import { useAuth } from './auth/AuthContext.js'
import AppHeader from './components/AppHeader.jsx'
import Notice from './components/Notice.jsx'
import AuthScreen from './screens/AuthScreen.jsx'
import FeedScreen from './screens/FeedScreen.jsx'
import ComposeScreen from './screens/ComposeScreen.jsx'

function SocialLens() {
  const { session, signOut } = useAuth()
  const [screen, setScreen] = useState('feed')
  const [notice, setNotice] = useState('')

  const expired = useCallback(() => {
    signOut()
    setScreen('login')
    setNotice('Your session ended. Please log in again.')
  }, [signOut])

  function navigate(next) {
    setNotice('')
    setScreen(next === 'compose' && !session ? 'login' : next)
  }
  function signedOut() {
    signOut()
    setScreen('feed')
    setNotice('You have signed out on this page.')
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <AppHeader session={session} screen={screen} navigate={navigate} onSignOut={signedOut} />
      <main id="main-content" tabIndex={-1}>
        {notice && <Notice>{notice}</Notice>}
        {screen === 'feed' && <FeedScreen session={session} navigate={navigate} onExpired={expired} />}
        {(screen === 'register' || screen === 'login') && <AuthScreen key={screen} mode={screen} navigate={navigate} onSuccess={() => { setScreen('feed'); setNotice('You’re signed in. Welcome to SocialLens.') }} />}
        {screen === 'compose' && session && <ComposeScreen navigate={navigate} onPublished={() => { setScreen('feed'); setNotice('Your post has been published.') }} onExpired={expired} />}
      </main>
      <footer className="app-footer"><span>SocialLens</span><span>A place for your perspective.</span><span>CS 415 · Milestone 1</span></footer>
    </div>
  )
}

export default function App() {
  return <AuthProvider><SocialLens /></AuthProvider>
}
