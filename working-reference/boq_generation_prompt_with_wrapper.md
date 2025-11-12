# BOQ Generation Prompt (Master) + Wrapper

Below is the **full BOQ generation prompt** (the LLM prompt) and a small TypeScript wrapper that programmatically inserts the
`BOQParameterManager.formatForAIPrompt(...)` block into the **Inputs** area of the prompt before sending to your LLM client.

---

## BOQ Generation Prompt (Master)

You are an expert PV electrical designer. Produce a **Bill of Quantities (BOQ)** for a Solar PV plant covering only the items listed under **Scope** below. Use **only** the inputs provided (names and values from the input block I will pass). Apply the deterministic rules and defaults shown in the Rules & Defaults section — **never** output ranges; each assumed/default value must be a single, explicit number or string. Do **not** invent additional variables. Follow IEC standards referenced below. Return **only** a 3-column table with exact columns:

```
Description | Specifications | Qty
```

No text, notes, calculations, extra columns, code, or commentary — only the table rows.

---

### Scope of BOQ items (include these items only)
1. DC structure earthing — bonding jumpers, DC PE conductors, DC earth pits.  
2. Lightning protection — ESE lightning arrestors, LA earth pits, earthing compound.  
3. AC earthing — PE conductors, equipment bonding, earth grid strips & rods.  
4. AC instrumentation & protection:
   - Current Transformers (protection & metering)  
   - Potential Transformers (if applicable)  
   - AC Surge Protective Devices (SPDs)  
   - Protection relays (LV & HV panels)  
   - Communication cables  
   - Net meter at Point of Connection (PoC)  
5. Busbars (LV & HV panels/substation)  
6. Transformer earthing — neutral and body earthing pits

Standards to follow: **IEC 60364-5-54, IEC 62561, IEC 60228, IEC 61869, IEC 60255, IEC 61643-11, IEC 60099-4, IEC 61439, IEC 62271, DLMS/IEC 62056, IS 3043**.

---

## Inputs (INJECTED PROGRAMMATICALLY)

**This block is dynamically inserted by your app.** The wrapper will replace this exact marker with the output of `BOQParameterManager.formatForAIPrompt(calculationType)`.

```
{{INPUTS_BLOCK}}
```

---

## Rules & Deterministic Defaults (use exactly these single values if input missing)

### DC Structure Earthing
- Bonding jumpers: **6 mm²** tinned Cu, **PVC**, **2 m** each, **1 per table**.  
- DC PE sizing: **adiabatic method** with `Ik = stringShortCircuitCurrentA`, `t = 1 s`, `k = 115` → compute conductor S and round **up** to next IEC 60228 standard size. Minimum **6 mm²**.  
- DC PE length: use provided `totalCableLengthPer...` values; if not present, use default **5 m per table**.  
- DC earth pits: **1 pit per 20 tables**, each pit = copper-bonded steel rod **3 m × Ø16 mm**.

### Lightning Protection (ESE)
- Number of ESE LAs = `ceil(totalPlantAreaM2 ÷ 10,000)`.  
- LA spec: **ESE LA**, coverage radius **79 m**, mast **SS 6 m** (IEC 62305 / IEC 62561).  
- Each LA requires **3** dedicated earth pits (3 m × Ø16 mm).  
- Earthing compound: **25 kg** per pit (bentonite + graphite).

### AC Earthing
- LV PE sizing (IEC Table 54.2):  
  - If phase cable ≤ **16 mm²** → PE = same size.  
  - If 16 < phase ≤ 35 mm² → PE = **16 mm²**.  
  - If phase > 35 mm² → PE = phase ÷ **2** (then round up to next IEC size).  
- HV PE sizing: **adiabatic method** with `Ik = 10 kA`, `t = 1 s`, `k = 115`; round up to IEC sizes.  
- PE length = same physical route length as phase conductor (use precomputed totals when available).  
- Equipment bonding:  
  - LV: **6 mm²** tinned Cu, **2 m** each, **1 per inverter** + **1 per combiner**.  
  - HV: **16 mm²** tinned Cu, **3 m** each, **2 per** inverter skid / IDT / PT.  
- Earth grid: default yard if absent — LV **30×30 m**, HV **40×40 m**. Use **Cu strip 50×6 mm**, mesh spacing **10 m**, rods **every 20 m along perimeter** + 4 corner rods. Soil resistivity defaults (Ω·m): saturated_clay **30**, clay **60**, loam **100**, moist_sand **200**, dry_sand **500**, rock **1000**. Target Rg: LV **5 Ω**, HV **1 Ω**; if estimated Rg > target, add rods until target met.

### CTs & PTs
- LV CTs: Protection **5P10**, burden **10 VA**, secondary **5 A**, primary = **1.2 × breaker rating** (round up to standard primary). Metering CT: Class **0.5**, burden **10 VA**, secondary **5 A**. Output CT count: 3 cores (one per phase).  
- HV CTs: Protection **5P20**, burden **15 VA**, secondary **5 A**, primary = **1.25 × rated current**. Metering CT: Class **0.2S**, burden **15 VA**, secondary **5 A**.  
- LV PTs: only if utility requires — ratio **415/√3 → 110/√3**, Class **0.5**, **15 VA**.  
- HV PTs: e.g., **11 kV/√3 → 110 V/√3**, Class **0.5** (metering 25 VA), protection class 3P (25 VA).

### SPDs
- LV panels: **Type 2**, 3-phase, Uc = **320 V AC**, Imax = **40 kA**, Up ≤ **1.5 kV**.  
- LV incomer/transformer secondary: **Type 1+2** only if `lightning` or `overhead` exposure is present (if not specified assume **Type 2**).  
- HV: ZnO surge arresters, Ur = **18 kV** for 11 kV systems; Ur = **42 kV** for 33 kV systems.

### Protection Relays
- LV panels: numeric relay with functions **50/51**, **50N/51N**, **27/59**, **81O/81U**.  
- HV feeders/transformers: add **46**, **49**, **87T** where transformer or utility spec requires.

### Communications
- Inverter → SCADA: **RS-485** shielded, 2-pair, **24 AWG**, LSZH, 120 Ω; length = route length + **10%** slack.  
- LAN inside building: **Cat-6** LSZH; length = route length + **10%** slack.  
- Yard to substation: **single-mode fiber**, **12-core OS2** armoured; length = route length + **10%** slack.

### Net Meter (PoC)
- **3-phase 4-wire**, bidirectional, **DLMS/IEC 62056**, Class **0.2S**, CT/PT-operated (secondary **5 A**), comms **RS-485 + Ethernet**.

### Busbars
- LV panels: copper busbar sized for **1.5 × panel incomer current**, temp-rise ≤ **70°C** per IEC 61439-2.  
- HV switchgear: copper busbar sized for **1.25 × rated current**, short-time withstand **31.5 kA (1 s)** per IEC 62271.

### Transformer Earthing (HV only)
- For every transformer included: neutral earthing = **2** dedicated pits (3 m × Ø16 mm each); body/tank earthing = **2** dedicated pits (3 m × Ø16 mm each). Total **4 pits per transformer**. Interconnect with **Cu strip 50×6 mm** to earth grid. Earthing compound **25 kg** per pit.

---

## Output rules (mandatory)
- The LLM must produce a BOQ table with rows for all items required by the inputs and rules above. Each BOQ row must contain:
  1. **Description** — short item label (e.g., `Earthing Cable (PE) – Inverter→Combiner`).  
  2. **Specifications** — deterministic spec string (size, material, insulation, standard references). Example: `16 mm² tinned Cu, PVC, IEC 60364-5-54 / IEC 60228`.  
  3. **Qty** — an exact numeric quantity or length (e.g., `240 m` or `12 Nos` or `1 Lot`). No ranges, no ± tolerances.

- Group ballast/LA/earth pits per zone if zone data present in inputs (if not present, use defaults above).  
- If inputs include precomputed cable totals or breaker ratings, use those values directly. If not, compute using the deterministic formulas given above. Show aggregated lengths as `m` in Qty column. For cables, use the precomputed `completeCableLength...` fields or compute distance × runs × circuits using `"<n>R*<mm2>"` format to extract runs.

- **Strict**: Output **no** additional prose, no calculations, no commentary. Only the table rows.

---

## Sample BOQ row format (must match exactly)
```
Description | Specifications | Qty
Earthing Cable (PE) – Inverter→Combiner | 16 mm² tinned Cu, PVC, IEC 60364-5-54 / IEC 60228 | 240 m
Earthing Electrodes | Copper-bonded rod 3 m × Ø16 mm, IEC 62561-2 | 12 Nos
...
```

---

## TypeScript Wrapper: insert inputs and return final prompt string

Use this TypeScript snippet in your client app (Vite / React). It assumes access to the same `boqParameterManager` instance you provided (or that your app exposes `boqParameterManager.formatForAIPrompt(calculationType)` on the client). The wrapper returns the final prompt string ready to send to your LLM client.

```ts
// src/services/boqPromptWrapper.ts
import { boqParameterManager } from './path/to/boqParameterManager'; // adjust path as needed

const MASTER_PROMPT_TEMPLATE = `
You are an expert PV electrical designer. Produce a **Bill of Quantities (BOQ)** for a Solar PV plant covering only the items listed under **Scope** below. Use **only** the inputs provided (names and values from the input block I will pass). Apply the deterministic rules and defaults shown in the Rules & Defaults section — **never** output ranges; each assumed/default value must be a single, explicit number or string. Do **not** invent additional variables. Follow IEC standards referenced below. Return **only** a 3-column table with exact columns:

\`\`\`
Description | Specifications | Qty
\`\`\`

No text, notes, calculations, extra columns, code, or commentary — only the table rows.

---

## Scope of BOQ items (include these items only)
1. DC structure earthing — bonding jumpers, DC PE conductors, DC earth pits.
2. Lightning protection — ESE lightning arrestors, LA earth pits, earthing compound.
3. AC earthing — PE conductors, equipment bonding, earth grid strips & rods.
4. AC instrumentation & protection:
   - Current Transformers (protection & metering)
   - Potential Transformers (if applicable)
   - AC Surge Protective Devices (SPDs)
   - Protection relays (LV & HV panels)
   - Communication cables
   - Net meter at Point of Connection (PoC)
5. Busbars (LV & HV panels/substation)
6. Transformer earthing — neutral and body earthing pits

Standards to follow: IEC 60364-5-54, IEC 62561, IEC 60228, IEC 61869, IEC 60255, IEC 61643-11, IEC 60099-4, IEC 61439, IEC 62271, DLMS/IEC 62056, IS 3043.

---

## Inputs (INJECTED PROGRAMMATICALLY)

{{INPUTS_BLOCK}}

---

## Rules & Deterministic Defaults
(omitted here for brevity but included in your master prompt on the server)
`;

/**
 * Build the final BOQ prompt by inserting the formatted inputs block.
 * @param calculationType 'LV' | 'HV_String' | 'HV_Central'
 * @returns final prompt string ready to send to LLM
 */
export async function buildBoqPromptForLLM(calculationType: 'LV' | 'HV_String' | 'HV_Central'): Promise<string> {
  // Ensure you have the BOQParameterManager singleton available in the client runtime
  const inputsBlock = boqParameterManager.formatForAIPrompt(calculationType);
  // Sanitize newline sequences
  const sanitizedInputs = inputsBlock.replace(/\r\n/g, '\n');
  const finalPrompt = MASTER_PROMPT_TEMPLATE.replace('{{INPUTS_BLOCK}}', sanitizedInputs);
  return finalPrompt;
}

/**
 * Optional helper: send prompt to your LLM client (example using fetch to your backend endpoint)
 * You should implement the '/api/llm' endpoint in your backend to call your chosen LLM provider.
 */
export async function sendPromptToLLM(finalPrompt: string): Promise<any> {
  const res = await fetch('/api/llm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: finalPrompt })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${txt}`);
  }
  return res.json();
}
```

> Note: The wrapper returns the full prompt string. It is intentionally simple — it does not perform parsing of the LLM response. Keep the `"Rules & Deterministic Defaults"` full text in the MASTER prompt deployed in your app for safety and traceability; in the snippet above it's abbreviated for brevity — in production paste the full master prompt content into `MASTER_PROMPT_TEMPLATE` (we saved the full prompt in the markdown file you requested).

---

## Example usage (client-side)
```ts
import { buildBoqPromptForLLM, sendPromptToLLM } from '@/services/boqPromptWrapper';

async function generateBoqRun() {
  const finalPrompt = await buildBoqPromptForLLM('LV'); // or 'HV_String' or 'HV_Central'
  // save prompt + inputs to Supabase/DB if required
  const apiResp = await sendPromptToLLM(finalPrompt);
  // parse apiResp to extract table and display in UI
}
```

---

## File saved to disk
This markdown file has been saved to: `/mnt/data/boq_generation_prompt_with_wrapper.md`
