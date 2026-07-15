// Datas de nascimento/falecimento são armazenadas como "data pura" (meia-noite UTC),
// vindas de um <input type="date">. Usamos sempre os métodos UTC ao ler/formatar
// para evitar que o fuso horário do servidor desloque o dia exibido.

function toDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function formatDate(date: Date | string | null | undefined) {
  if (!date) return null;
  const d = toDate(date);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function calculateAge(
  birthDate: Date | string | null | undefined,
  referenceDate: Date | string | null | undefined = new Date(),
) {
  if (!birthDate) return null;
  const birth = toDate(birthDate);
  const ref = toDate(referenceDate ?? new Date());

  const birthYear = birth.getUTCFullYear();
  const birthMonth = birth.getUTCMonth();
  const birthDay = birth.getUTCDate();

  const refYear = ref.getUTCFullYear();
  const refMonth = ref.getUTCMonth();
  const refDay = ref.getUTCDate();

  let age = refYear - birthYear;
  if (refMonth < birthMonth || (refMonth === birthMonth && refDay < birthDay)) {
    age--;
  }
  return age;
}

const MONTH_NAMES_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function getMonthNamePt(monthIndex: number) {
  return MONTH_NAMES_PT[monthIndex] ?? "";
}

export function toDateInputValue(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = toDate(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
