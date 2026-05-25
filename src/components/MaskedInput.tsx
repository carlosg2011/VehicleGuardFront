import { Controller } from 'react-hook-form';

const defaultCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

export type MaskKey = 'cpfCnpj' | 'telefone' | 'renavam';

function applyMask(raw: string, type: MaskKey): string {
  const d = raw.replace(/\D/g, '');

  if (type === 'cpfCnpj') {
    if (d.length <= 11) {
      return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return d
      .slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  if (type === 'telefone') {
    const t = d.slice(0, 11);
    if (t.length <= 10) {
      return t
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    }
    return t
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  }

  if (type === 'renavam') {
    return d.slice(0, 11);
  }

  return raw;
}

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  name: string;
  mask: MaskKey;
  rules?: Record<string, unknown>;
  placeholder?: string;
  className?: string;
}

export default function MaskedInput({
  control,
  name,
  mask,
  rules,
  placeholder,
  className = defaultCls,
}: Props) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { ref, onChange, value, ...rest } }) => (
        <input
          ref={ref}
          value={applyMask(value ?? '', mask)}
          onChange={(e) => onChange(applyMask(e.target.value, mask))}
          className={className}
          placeholder={placeholder}
          inputMode={mask === 'renavam' ? 'numeric' : 'text'}
          {...rest}
        />
      )}
    />
  );
}

export const Masks: Record<MaskKey, MaskKey> = {
  cpfCnpj: 'cpfCnpj',
  telefone: 'telefone',
  renavam: 'renavam',
};
