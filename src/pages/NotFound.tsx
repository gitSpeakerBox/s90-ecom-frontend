import { useLocale } from '../context/LocaleContext'
import { Button } from '../components/common/Button'
import './NotFound.css'

export const NotFound = () => {
  const { t } = useLocale()

  return (
    <div className="not-found">
      <span className="not-found-eyebrow">{t('common.error404')}</span>
      <h1 className="not-found-title">{t('common.pageNotFound')}</h1>
      <p className="not-found-description">
        {t('common.pageNotFoundDesc')}
      </p>
      <Button variant="dark" to="/">
        {t('common.returnToHome')}
      </Button>
    </div>
  )
}

