import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'outline' | 'dashed';
  isLoading?: boolean;
}

export function Button({ title, variant = 'primary', isLoading, ...rest }: ButtonProps) {
  let bgClass = 'bg-[#5c7cfa]';
  let textClass = 'text-white';
  let borderClass = '';

  if (variant === 'outline') {
    bgClass = 'bg-white';
    textClass = 'text-slate-800';
    borderClass = 'border border-slate-300';
  } else if (variant === 'dashed') {
    bgClass = 'bg-[#edf2ff]';
    textClass = 'text-[#4c6ef5]';
    borderClass = 'border border-dashed border-[#bac8ff]';
  }

  return (
    <TouchableOpacity
      className={`h-12 flex-row justify-center items-center rounded-2xl px-4 ${bgClass} ${borderClass} ${
        rest.disabled ? 'opacity-50' : 'opacity-100'
      }`}
      disabled={isLoading || rest.disabled}
      activeOpacity={0.8}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#4c6ef5'} />
      ) : (
        <Text className={`font-semibold text-base ${textClass}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}





