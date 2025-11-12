// BOQ Table Parser and Validator
// Implements strict validation according to detailed instructions
// NO deviation from parsing and validation rules

export interface ParsedBOQRow {
  description: string;
  specifications: string;
  qty: string;
  unit: string;
  category?: string; // Optional category for merged BOQ organization
}

export interface ParsedBOQ {
  rows: ParsedBOQRow[];
  metadata: {
    totalRows: number;
    hasValidHeader: boolean;
    parsedSuccessfully: boolean;
  };
}

/**
 * Parse and validate table markdown according to exact specifications
 * Throws detailed errors on failure for retry logic
 */
export function parseAndValidateTable(text: string): ParsedBOQRow[] {
  console.log('📋 Starting table parsing and validation...');
  console.log('📄 Input text length:', text.length, 'characters');
  
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from LLM');
  }

  const lines = text.split(/\r?\n/);
  console.log('📄 Total lines:', lines.length);
  
  // Find header line containing Description and Qty (case insensitive)
  const headerIdx = lines.findIndex(line => {
    const lowerLine = line.toLowerCase();
    return lowerLine.includes('description') && lowerLine.includes('qty');
  });
  
  if (headerIdx === -1) {
    console.error('❌ No table header found. Looking for lines containing "Description" and "Qty"');
    console.log('📄 Available lines:', lines.slice(0, 10).join('\n')); // Log first 10 lines for debugging
    throw new Error('No table header found. Expected header with "Description | Specifications | Qty"');
  }
  
  console.log('✅ Header found at line:', headerIdx);
  console.log('📋 Header line:', lines[headerIdx]);
  
  // Validate header has exactly 3 columns
  const headerCols = lines[headerIdx].split('|').map(c => c.trim()).filter(c => c.length > 0);
  if (headerCols.length !== 3) {
    throw new Error(`Invalid header format. Expected 3 columns, found ${headerCols.length}: ${headerCols.join(' | ')}`);
  }
  
  // Collect table rows (skip separator line with ---)
  const rows: ParsedBOQRow[] = [];
  let separatorFound = false;
  
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines at the start
    if (!line) {
      if (rows.length > 0) {
        break; // End of table
      }
      continue;
    }
    
    // Skip separator line (contains ---)
    if (line.includes('---')) {
      separatorFound = true;
      continue;
    }
    
    // Parse table row
    if (line.includes('|')) {
      const cols = line.split('|').map(c => c.trim());
      
      // Remove empty first/last columns if they exist (due to leading/trailing |)
      const cleanCols = cols.filter((col, idx) => {
        if (idx === 0 || idx === cols.length - 1) {
          return col.length > 0;
        }
        return true;
      });
      
      if (cleanCols.length !== 3) {
        console.warn(`⚠️ Skipping malformed row with ${cleanCols.length} columns:`, line);
        continue;
      }
      
      const [description, specifications, qtyWithUnit] = cleanCols;
      
      // Split qty with unit into separate qty and unit
      const { qty, unit } = splitQtyAndUnit(qtyWithUnit.trim());
      
      // Validate each cell according to specifications
      const validatedRow = validateBOQRow({
        description: description.trim(),
        specifications: specifications.trim(),
        qty: qty,
        unit: unit
      }, i);
      
      rows.push(validatedRow);
    }
  }
  
  console.log(`📊 Parsed ${rows.length} table rows`);
  
  if (rows.length === 0) {
    throw new Error('No valid table rows found. Table must contain at least one row.');
  }
  
  console.log('✅ Table parsing completed successfully');
  return rows;
}

/**
 * Validate individual BOQ row according to specifications
 */
function validateBOQRow(row: ParsedBOQRow, lineNumber: number): ParsedBOQRow {
  // Validate description
  if (!row.description || row.description.length === 0) {
    throw new Error(`Row ${lineNumber}: Description cannot be empty`);
  }
  
  if (row.description.length > 200) {
    throw new Error(`Row ${lineNumber}: Description too long (${row.description.length} chars). Maximum 200 characters.`);
  }
  
  // Validate specifications
  if (!row.specifications || row.specifications.length === 0) {
    throw new Error(`Row ${lineNumber}: Specifications cannot be empty`);
  }
  
  // Check specifications contain material and size information
  const specs = row.specifications.toLowerCase();
  const hasMaterial = specs.includes('cu') || specs.includes('copper') || specs.includes('tinned') || 
                     specs.includes('pvc') || specs.includes('lszh') || specs.includes('steel') ||
                     specs.includes('ss') || specs.includes('bentonite');
  
  const hasSize = /\d+\s*(mm²?|m|kv|va|a|ω|kg)/.test(specs) || specs.includes('ø');
  
  if (!hasMaterial && !hasSize) {
    console.warn(`⚠️ Row ${lineNumber}: Specifications may be incomplete:`, row.specifications);
  }
  
  // Validate quantity format - now should be only numeric
  if (!row.qty || row.qty.length === 0) {
    throw new Error(`Row ${lineNumber}: Qty cannot be empty`);
  }
  
  // Check qty format: must be numeric only (no units)
  const qtyPattern = /^\d+(\.\d+)?$/;
  
  if (!qtyPattern.test(row.qty.trim())) {
    // Check for common invalid patterns
    if (row.qty.includes('–') || row.qty.includes('-') || row.qty.includes('to') || row.qty.includes('±')) {
      throw new Error(`Row ${lineNumber}: Qty contains range or uncertainty: "${row.qty}". Must be exact single value.`);
    }
    
    if (row.qty.includes('?') || row.qty.includes('TBD') || row.qty.includes('vary')) {
      throw new Error(`Row ${lineNumber}: Qty is uncertain: "${row.qty}". Must be deterministic value.`);
    }
    
    throw new Error(`Row ${lineNumber}: Invalid Qty format: "${row.qty}". Expected format: numeric only like "240", "12", "1".`);
  }
  
  // Validate unit format
  if (!row.unit || row.unit.length === 0) {
    throw new Error(`Row ${lineNumber}: Unit cannot be empty`);
  }
  
  // Check unit format: must be valid unit
  const unitPattern = /^(m|Nos|Lot|kg|Bags?|A|kA|VA|kV|Ω)$/i;
  
  if (!unitPattern.test(row.unit.trim())) {
    throw new Error(`Row ${lineNumber}: Invalid Unit format: "${row.unit}". Expected units: m, Nos, Lot, kg, Bags, A, kA, VA, kV, Ω`);
  }
  
  return row;
}

/**
 * Normalize quantity units for consistency
 * Supports both old format ("25 m") and new format (qty="25", unit="m")
 */
export function normalizeUnits(qtyOrCombined: string, unit?: string): { value: number; unit: string } {
  let value: number;
  let unitToNormalize: string;
  
  if (unit !== undefined) {
    // New format: separate qty and unit parameters
    value = parseFloat(qtyOrCombined.trim());
    unitToNormalize = unit;
  } else {
    // Old format: combined "25 m" string - split it first
    const split = splitQtyAndUnit(qtyOrCombined);
    value = parseFloat(split.qty);
    unitToNormalize = split.unit;
  }
  
  if (isNaN(value)) {
    return { value: 0, unit: 'Unknown' };
  }
  
  if (!unitToNormalize) {
    return { value, unit: 'Unknown' };
  }
  
  let normalizedUnit = unitToNormalize.toLowerCase();
  
  // Normalize common unit variations
  const unitMap: Record<string, string> = {
    'nos': 'Nos',
    'no': 'Nos', 
    'pieces': 'Nos',
    'pcs': 'Nos',
    'lot': 'Lot',
    'lots': 'Lot',
    'm': 'm',
    'meter': 'm',
    'metres': 'm',
    'kg': 'kg',
    'kilogram': 'kg',
    'bags': 'Bags',
    'bag': 'Bags',
    'a': 'A',
    'amp': 'A',
    'amps': 'A',
    'va': 'VA',
    'kv': 'kV',
    'ω': 'Ω',
    'ohm': 'Ω',
    'ohms': 'Ω'
  };
  
  const finalUnit = unitMap[normalizedUnit] || unitToNormalize;
  
  return { value, unit: finalUnit };
}

/**
 * Split quantity with unit into separate qty and unit parts
 * Examples: "25 m" → {qty: "25", unit: "m"}, "3 Nos" → {qty: "3", unit: "Nos"}
 */
export function splitQtyAndUnit(qtyWithUnit: string): { qty: string; unit: string } {
  if (!qtyWithUnit || qtyWithUnit.trim().length === 0) {
    return { qty: '0', unit: 'Unknown' };
  }
  
  const trimmed = qtyWithUnit.trim();
  
  // Match pattern: number followed by optional space and unit
  // Examples: "25 m", "3 Nos", "120kg", "1 Lot"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  
  if (!match) {
    // If no match, assume it's all quantity
    return { qty: trimmed, unit: 'Unknown' };
  }
  
  const [, qtyPart, unitPart] = match;
  
  // If no unit part, default to appropriate unit based on quantity
  if (!unitPart || unitPart.trim() === '') {
    return { qty: qtyPart, unit: 'Nos' };
  }
  
  return {
    qty: qtyPart,
    unit: unitPart.trim()
  };
}

/**
 * Extract runs from cable cross-section format (e.g., "4R*120" → 4)
 * Helper function for cable length computations
 */
export function extractRunsFromCrossSection(crossSection: string): number {
  if (!crossSection) return 1;
  
  const match = crossSection.match(/(\d+)R\*/);
  return match ? parseInt(match[1]) : 1;
}

/**
 * Validate complete BOQ structure and provide detailed feedback
 */
export function validateCompleteBOQ(rows: ParsedBOQRow[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalItems: number;
    categories: string[];
    totalEstimatedValue: string;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const categories = new Set<string>();
  
  // Check minimum BOQ requirements
  if (rows.length < 5) {
    warnings.push(`BOQ has only ${rows.length} items. Typical BOQ should have 10+ items for comprehensive coverage.`);
  }
  
  // Categorize items and check coverage
  const requiredCategories = [
    'DC', 'Lightning', 'Earthing', 'CT', 'Busbar', 'Cable'
  ];
  
  rows.forEach((row, idx) => {
    const desc = row.description.toLowerCase();
    
    // Categorize
    if (desc.includes('dc') || desc.includes('bonding')) categories.add('DC');
    if (desc.includes('lightning') || desc.includes('la ') || desc.includes('ese')) categories.add('Lightning');
    if (desc.includes('earth') || desc.includes('grid') || desc.includes('rod')) categories.add('Earthing');
    if (desc.includes('ct') || desc.includes('current transformer')) categories.add('CT');
    if (desc.includes('busbar')) categories.add('Busbar');
    if (desc.includes('cable') || desc.includes('conductor')) categories.add('Cable');
    
    // Check for suspicious quantities
    const { value } = normalizeUnits(row.qty, row.unit);
    if (value > 10000) {
      warnings.push(`Row ${idx + 1}: Very large quantity (${row.qty} ${row.unit}). Please verify.`);
    }
  });
  
  // Check coverage
  const missingCategories = requiredCategories.filter(cat => !categories.has(cat));
  if (missingCategories.length > 0) {
    warnings.push(`Potentially missing categories: ${missingCategories.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalItems: rows.length,
      categories: Array.from(categories),
      totalEstimatedValue: `${rows.length} line items`
    }
  };
}
