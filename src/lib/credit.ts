// Klient-trygge hjelpere for kreditt (ingen Node-avhengigheter).

export const CODE_KEY = "robothjelp:code";
export const BALANCE_KEY = "robothjelp:saldo_ore";
/** Valgt modellnivå. Settes ved innløsning så chatten starter på betalt nivå. */
export const TIER_KEY = "robothjelp:model";

export function formatOre(ore: number): string {
  const kroner = ore / 100;
  return Number.isInteger(kroner)
    ? `${kroner} kr`
    : `${kroner.toFixed(2).replace(".", ",")} kr`;
}
