// Funzioni di generazione utenti

export function generateRandomName(ITALIAN_FIRST_NAMES: string[]): string {
  return ITALIAN_FIRST_NAMES[Math.floor(Math.random() * ITALIAN_FIRST_NAMES.length)];
}

export function generateRandomSurname(ITALIAN_LAST_NAMES: string[]): string {
  return ITALIAN_LAST_NAMES[Math.floor(Math.random() * ITALIAN_LAST_NAMES.length)];
}

export function generateEmail(name: string, surname: string, index?: number): string {
  const nameClean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suffix = index !== undefined ? index : "";
  return `${nameClean}${suffix}@test.it`;
}

export function generateUsername(name: string, surname: string, index?: number): string {
  const nameClean = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const surnameClean = surname.toLowerCase().replace(/[^a-z0-9]/g, "");
  const patterns = [
    `${nameClean}_${surnameClean}`,
    `${nameClean}${Math.floor(Math.random()*90+10)}`,
    `${surnameClean}_${nameClean.charAt(0)}`,
    `${nameClean.substring(0, 4)}_${surnameClean.substring(0, 4)}`,
    `${nameClean.substring(0, 6)}${Math.floor(Math.random()*999+1)}`,
  ];
  let base = patterns[Math.floor(Math.random()*patterns.length)];
  if (index !== undefined && base.length < 15) base = `${base}${index}`;
  if (base.length > 20) base = base.substring(0, 20);
  return base;
}
