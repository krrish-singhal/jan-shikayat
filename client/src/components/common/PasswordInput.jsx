import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

export const PasswordInput = forwardRef(({
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
  minLength,
  showLockIcon = false,
  name,
  id,
  disabled = false,
  autoComplete = 'current-password',
  ...rest
}, ref) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      {showLockIcon && (
        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      )}
      <input
        ref={ref}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        name={name}
        id={id}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`civic-input ${showLockIcon ? 'pl-10 pr-10' : 'pr-10'} ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none p-1 rounded-md transition-colors"
        aria-label={show ? 'Hide password' : 'Show password'}
        tabIndex={-1}
      >
        {show ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';
export default PasswordInput;

