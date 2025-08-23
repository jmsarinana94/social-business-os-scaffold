import * as React from 'react';

export function Button({
  children,
  className = '',
  ...props
}: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={
        'inline-flex items-center justify-center rounded-2xl border px-4 py-2 transition hover:opacity-90 ' +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}
