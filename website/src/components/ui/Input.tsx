import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-bold uppercase tracking-wider text-black mb-2">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-black pointer-events-none group-focus-within:scale-110 group-focus-within:translate-x-[2px] group-focus-within:translate-y-[calc(-50%+2px)] transition-all">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full ${icon ? 'pl-10' : 'px-4'} py-3 
              bg-white border-2 border-black 
              shadow-[4px_4px_0px_#000] 
              focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] 
              outline-none transition-all 
              placeholder:text-gray-400 placeholder:uppercase placeholder:text-[10px]
              ${error ? 'border-red-500 shadow-[4px_4px_0px_#ef4444]' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="mt-2 text-[10px] font-bold uppercase text-red-600 bg-red-50 p-1 border border-red-200 inline-block">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';


