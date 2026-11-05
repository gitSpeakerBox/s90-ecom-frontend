import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import type { Country } from '../../data/countries'
import './TopBar.css'

export interface TopBarProps {
  dropdownOpen?: boolean
  onDropdownChange?: (open: boolean) => void
}

export const TopBar = ({
  dropdownOpen: controlledOpen,
  onDropdownChange,
}: TopBarProps) => {
  const { language, setLanguage, country, setCountry, countries, t } =
    useLocale()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const dropdownOpen = isControlled ? controlledOpen : internalOpen
  const dropdownRef = useRef<HTMLDivElement>(null)

  const toggleDropdown = () => {
    const next = !dropdownOpen
    if (!isControlled) {
      setInternalOpen(next)
    }
    onDropdownChange?.(next)
  }

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return

    const closeDropdown = () => {
      if (!isControlled) {
        setInternalOpen(false)
      }
      onDropdownChange?.(false)
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        closeDropdown()
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dropdownOpen, isControlled, onDropdownChange])

  const handleSelectCountry = (c: Country) => {
    setCountry(c)
    if (!isControlled) {
      setInternalOpen(false)
    }
    onDropdownChange?.(false)
  }

  return (
    <div className="top-bar-block">
      {/* Row 1: Utility Bar */}
      <div className="top-utility-bar">
        {/* Left / start: Language Switch */}
        <div
          className="top-utility-lang"
          role="group"
          aria-label={t('topBar.languageSelection')}
        >
          <button
            type="button"
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            aria-pressed={language === 'en'}
          >
            {t('topBar.english')}
          </button>
          <span className="lang-divider" aria-hidden="true">
            /
          </span>
          <button
            type="button"
            className={`lang-btn ${language === 'ar' ? 'active' : ''}`}
            onClick={() => setLanguage('ar')}
            aria-pressed={language === 'ar'}
          >
            {t('topBar.arabic')}
          </button>
        </div>

        {/* Right / end: Country Selector Dropdown */}
        <div className="top-utility-country" ref={dropdownRef}>
          <button
            type="button"
            className="country-trigger-btn"
            onClick={toggleDropdown}
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
            aria-label={t('topBar.countrySelectorAria', {
              country: t(`topBar.countries.${country.code}`, { defaultValue: country.name }),
            })}
          >
            <span className={`fi fi-${country.flag}`} aria-hidden="true" />
            <span className="country-name">
              {t(`topBar.countries.${country.code}`, { defaultValue: country.name })}
            </span>
            <ChevronDown
              size={12}
              className={`country-chevron ${dropdownOpen ? 'open' : ''}`}
              aria-hidden="true"
            />
          </button>

          {dropdownOpen && (
            <ul
              className="country-dropdown-panel"
              role="listbox"
              aria-label={t('topBar.selectCountry')}
            >
              {countries.map((c) => {
                const isSelected = c.name === country.name
                const localizedCountryName = t(`topBar.countries.${c.code}`, {
                  defaultValue: c.name,
                })
                return (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={isSelected}
                    className={`country-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectCountry(c)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSelectCountry(c)
                      }
                    }}
                    tabIndex={0}
                  >
                    <span className={`fi fi-${c.flag}`} aria-hidden="true" />
                    <span className="country-option-name">{localizedCountryName}</span>
                    <span className="country-option-currency">({c.currency})</span>
                    {isSelected && (
                      <Check size={14} className="country-option-check" />
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

    
    </div>
  )
}

