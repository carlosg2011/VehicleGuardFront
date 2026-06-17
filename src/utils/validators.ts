function digits(value: string): string {
  return value.replace(/\D/g, '');
}

function isValidCpf(d: string): boolean {
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let rem = sum % 11;
  if ((rem < 2 ? 0 : 11 - rem) !== parseInt(d[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  rem = sum % 11;
  return (rem < 2 ? 0 : 11 - rem) === parseInt(d[10]);
}

function isValidCnpj(d: string): boolean {
  if (/^(\d)\1{13}$/.test(d)) return false;

  const calc = (str: string, weights: number[]): boolean => {
    const sum = weights.reduce((acc, w, i) => acc + parseInt(str[i]) * w, 0);
    const rem = sum % 11;
    return (rem < 2 ? 0 : 11 - rem) === parseInt(str[weights.length]);
  };

  return (
    calc(d, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    calc(d, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}

export function validateCpfCnpj(value: string): true | string {
  const d = digits(value);
  if (d.length === 11) return isValidCpf(d) ? true : 'CPF inválido';
  if (d.length === 14) return isValidCnpj(d) ? true : 'CNPJ inválido';
  return 'Informe um CPF (11 dígitos) ou CNPJ (14 dígitos)';
}
