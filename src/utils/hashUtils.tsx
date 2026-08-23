import { ReactNode } from "react"
import { Row } from "../types"

// Funciones globales para calcular hash y rehashear el arreglo de forma instantánea
export const computeInitialHash = (val: number, algo: string, N: number) => {
  if (algo === "Hash Mod") return (val % N) + 1
  if (algo === "Hash Cuadrado") {
    const sq = (val * val).toString()
    const mid = Math.floor(sq.length / 2)
    const digits = sq.substring(Math.max(0, mid - 1), mid + 1)
    return (parseInt(digits || "0", 10) % N) + 1
  }
  if (algo === "Truncamiento") {
    const str = val.toString()
    let trunc = ""
    for (let i = 0; i < str.length; i += 2) trunc += str[i]
    return (parseInt(trunc || "0", 10) % N) + 1
  }
  if (algo === "Hash Plegamiento") {
    const str = val.toString()
    let sum = 0
    for (let i = 0; i < str.length; i += 2) {
      sum += parseInt(str.substring(i, i + 2), 10)
    }
    return (sum % N) + 1
  }
  return (val % N) + 1
}

export const computeSecondaryHash = (val: number, algo: string, N: number) => {
  const step = computeInitialHash(val, algo, N)
  return step === 0 ? 1 : step
}

export const rehashInstantly = (
  currentRows: Row[],
  algo: string,
  coll: string,
  double: string
) => {
  if (!currentRows || currentRows.length === 0 || !algo || !coll) return currentRows;
  if (coll === "Doble Función Hash" && !double) return currentRows;

  const N = currentRows.length;
  // Extraer claves actuales
  const allKeys: string[] = [];
  currentRows.forEach((r) => {
    if (r.key) {
      r.key.split(/, | -> /).forEach((kStr) => {
        const k = kStr.trim();
        if (k) allKeys.push(k);
      });
    }
  });

  // Crear arreglo vacío
  const newRows = Array.from({ length: N }, (_, i) => ({
    pos: i + 1,
    key: "",
    inactive: false,
  }));

  // Insertar instantáneo
  for (const key of allKeys) {
    const k = parseInt(key, 10);
    let pos = computeInitialHash(k, algo, N);
    let attempts = 0;
    let inserted = false;

    while (attempts < N) {
      const rowIdx = pos - 1;
      const currentRow = newRows[rowIdx];

      if (currentRow.key === "") {
        currentRow.key = key;
        inserted = true;
        break;
      } else {
        if (coll === "Lista Enlazada" || coll === "Arreglo Anidado") {
          currentRow.key =
            currentRow.key + (coll === "Lista Enlazada" ? " -> " : ", ") + key;
          inserted = true;
          break;
        }

        attempts++;
        if (coll === "Solución Lineal") {
          pos = (pos % N) + 1;
        } else if (coll === "Solución Cuadrática") {
          pos = ((pos - 1 + attempts * attempts) % N) + 1;
        } else if (coll === "Doble Función Hash") {
          const step = computeSecondaryHash(k, double, N);
          pos = ((pos - 1 + step) % N) + 1;
        }
      }
    }
  }
  return newRows;
};

export const renderLongDivision = (dividend: number, divisor: number) => {
  const divStr = dividend.toString();
  const L = divStr.length;

  let steps = [];
  let quotient = "";
  let current = "";

  for (let i = 0; i < divStr.length; i++) {
    current += divStr[i];
    let currentNum = parseInt(current, 10);

    if (quotient === "" && currentNum < divisor && i < divStr.length - 1) {
      continue;
    }

    let q = Math.floor(currentNum / divisor);
    quotient += q.toString();

    let prod = q * divisor;
    let rem = currentNum - prod;

    steps.push({
      stepDividend: currentNum,
      product: prod,
      remainder: rem,
      endIndex: i
    });

    current = rem === 0 ? "" : rem.toString();
  }

  if (quotient === "") quotient = "0";

  const lines: ReactNode[] = [];
  const barIndex = 2 + L + 1;

  lines.push(<div key="row0">  {divStr} │ {divisor}</div>);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];

    const prodStr = step.product.toString();
    const minusPos = 2 + step.endIndex - prodStr.length;
    let prodLine = "";
    for (let j = 0; j < minusPos; j++) prodLine += " ";
    prodLine += "-" + prodStr;

    while (prodLine.length < barIndex) prodLine += " ";

    if (i === 0) {
      prodLine += "└" + "─".repeat(Math.max(4, quotient.length + 2));
    }
    lines.push(<div key={`prod${i}`}>{prodLine}</div>);

    if (i < steps.length - 1) {
      const nextDivStr = steps[i + 1].stepDividend.toString();
      let remLine = "";
      const remEnd = 2 + steps[i + 1].endIndex;
      for (let j = 0; j < remEnd - nextDivStr.length + 1; j++) remLine += " ";
      remLine += nextDivStr;
      while (remLine.length < barIndex) remLine += " ";

      if (i === 0) {
        remLine += "  " + quotient;
      }
      lines.push(<div key={`rem${i}`}>{remLine}</div>);
    } else {
      const finalRemStr = step.remainder.toString();
      let remLineSpaces = "";
      const remEnd = 2 + step.endIndex;
      for (let j = 0; j < remEnd - finalRemStr.length + 1; j++) remLineSpaces += " ";
      lines.push(
        <div key={`finalrem`} className="flex items-center mt-1">
          <span className="whitespace-pre">{remLineSpaces}</span>
          <span className="bg-[#a23b2a] text-white font-bold px-1.5 py-0.5 rounded -ml-1.5 text-xs relative shadow-sm">
            {finalRemStr}
            <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-[10px] text-[#a23b2a] bg-[#a23b2a]/10 px-2 py-1 rounded-md font-sans tracking-wide whitespace-nowrap flex items-center gap-1.5 border border-[#a23b2a]/20 font-bold uppercase">
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              Residuo
            </span>
          </span>
        </div>
      );
    }
  }

  return (
    <div className="font-mono text-[13px] leading-[1.3] text-[#52241A] whitespace-pre bg-[#faf6f2] border border-[#52241A]/10 p-4 rounded-xl overflow-x-auto shadow-sm my-3 relative">
      {lines}
    </div>
  );
}
