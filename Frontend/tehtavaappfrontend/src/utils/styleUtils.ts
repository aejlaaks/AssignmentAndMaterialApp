/**
 * Apufunktio Tailwind-luokkien käyttöön
 * Tämä funktio ei tee mitään erityistä, mutta auttaa tunnistamaan Tailwind-luokat koodissa
 * @param classes Tailwind-luokat merkkijonona
 * @returns Samat luokat merkkijonona
 */
export const tw = (classes: string): string => classes;

/**
 * Yhdistää useita luokkia yhdeksi merkkijonoksi
 * @param classes Luokat, jotka halutaan yhdistää
 * @returns Yhdistetyt luokat merkkijonona
 */
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
}; 