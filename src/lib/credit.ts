// Klient-trygge hjelpere for kreditt (ingen Node-avhengigheter).

export const CODE_KEY = "sporfri:code";
export const BALANCE_KEY = "sporfri:saldo_ore";

export function formatOre(ore: number): string {
  const kroner = ore / 100;
  return Number.isInteger(kroner)
    ? `${kroner} kr`
    : `${kroner.toFixed(2).replace(".", ",")} kr`;
}
