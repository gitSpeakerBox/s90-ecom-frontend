interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  /** Hide the label visually (still announced). */
  hideLabel?: boolean
  disabled?: boolean
  title?: string
}

export function Toggle({ checked, onChange, label, hideLabel, disabled, title }: ToggleProps) {
  return (
    <label className="adm-switch" title={title} onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="adm-switch__track" aria-hidden="true" />
      <span className={hideLabel ? 'adm-sr-only' : undefined}>{label}</span>
    </label>
  )
}
