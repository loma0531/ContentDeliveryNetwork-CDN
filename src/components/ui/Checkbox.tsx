import React from 'react';

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onCheckedChange?: (checked: boolean) => void;
};

export const Checkbox: React.FC<CheckboxProps> = ({ className, onCheckedChange, ...props }) => {
  return (
    <input
      type="checkbox"
      className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className ?? ''}`}
      onChange={e => {
        props.onChange?.(e);
        onCheckedChange?.(e.target.checked);
      }}
      {...props}
    />
  );
};
