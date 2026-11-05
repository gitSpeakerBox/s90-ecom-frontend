import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocale } from '../context/LocaleContext'
import { Button } from '../components/common/Button'
import './JerseysHome.css'

export const Login = () => {
  const { user, login, logout } = useAuth()
  const { t } = useLocale()
  const [nameInput, setNameInput] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(nameInput.trim() || 'Alex Mercer')
    navigate('/')
  }

  return (
    <div className="catalog-placeholder">
      <span className="catalog-placeholder-eyebrow">{t('common.authentication')}</span>
      <h1 className="catalog-placeholder-title">
        {user ? t('common.welcomeBack', { name: user.name }) : t('common.signInTo')}
      </h1>
      <p className="catalog-placeholder-description">
        {user
          ? t('common.currentlySignedIn')
          : t('common.signInPrompt')}
      </p>

      {user ? (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            className="common-btn common-btn-dark"
            onClick={logout}
          >
            {t('header.signOut')}
          </button>
          <Button variant="dark" to="/">
            {t('common.continueShopping')}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleLogin}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxWidth: '320px',
            width: '100%',
          }}
        >
          <input
            type="text"
            placeholder={t('common.enterYourName')}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '1px solid var(--color-border-hairline)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              outline: 'none',
              backgroundColor: '#ffffff',
            }}
          />
          <button type="submit" className="common-btn common-btn-dark">
            {t('header.login')}
          </button>
        </form>
      )}
    </div>
  )
}

