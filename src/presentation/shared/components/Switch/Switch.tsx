import styles from './Switch.module.css';

export type SwitchProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
};

export function Switch({ checked, onChange, id, label, ariaLabel, disabled }: SwitchProps) {
  return (
    <div className={styles.wrapper}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        className={`${styles.switch} ${checked ? styles.on : styles.off} ${
          disabled ? styles.disabled : ''
        }`}
        onClick={() => !disabled && onChange(!checked)}
        type="button"
        disabled={disabled}
      >
        <span className={styles.knob} aria-hidden />
      </button>
    </div>
  );
}
