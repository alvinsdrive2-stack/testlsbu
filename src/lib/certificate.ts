export function toRoman(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let result = "";
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  return result;
}

export function generateCertificateNumber(sequence: number): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = toRoman(date.getMonth() + 1);
  const paddedSeq = String(sequence).padStart(4, "0");
  return `${paddedSeq}/PUB/GAPENSI/${month}/${year}`;
}
