const arabicCombiningMarks = /(?=\p{Script_Extensions=Arabic})\p{Mark}/gu;
const tatweel = /\u0640/g;

export const normalizeArabicSearchText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(arabicCombiningMarks, "")
    .replace(tatweel, "")
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("ar")
    .trim();
