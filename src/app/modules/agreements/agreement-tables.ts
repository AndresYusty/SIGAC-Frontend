import { AgreementBlock, AgreementTypeDto } from './agreements.models';

/** One list of rows shared by every table of the agreement that has the same columns. */
export interface EditableTable {
  key: string;
  columns: string[];
  titles: string[][];
  rows: string[][];
}

const FIELD = /\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g;

export function tableKey(columns: string[]): string {
  return columns.join('\u0001');
}

/** A title row names the two sides of the table (program of origin, program of destination) and is not a course. */
function isBannerRow(row: string[]): boolean {
  const cells = row.map((cell) => cell ?? '');
  const hasPlaceholder = cells.some((cell) => cell.includes('{{'));
  const hasEmpty = cells.some((cell) => cell.trim() === '');
  return hasPlaceholder && hasEmpty && cells.every((cell) => cell.trim() === '' || cell.includes('{{'));
}

function literal(cell: string | null | undefined): string {
  return (cell ?? '').replace(/\{\{\s*[A-Za-z0-9_]+\s*\}\}/g, '').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]/g, '');
}

/** A sample row is example text written into the template, such as a course name and a grade. */
function isSampleRow(row: string[]): boolean {
  return row.some((cell) => literal(cell) !== '' && !(cell ?? '').includes('{{'));
}

function blank(width: number): string[] {
  return Array.from({ length: width }, () => '');
}

function pad(row: string[], width: number): string[] {
  const next = row.map((cell) => cell ?? '');
  while (next.length < width) next.push('');
  return next.slice(0, width);
}

/** Tables whose template contains example rows. The secretary replaces those rows. */
export function buildTables(type: AgreementTypeDto, saved: AgreementBlock[] = []): EditableTable[] {
  const seen = new Map<string, EditableTable>();
  for (const block of [...type.recitals, ...type.articles]) {
    if (block.type !== 'table' || !block.columns?.length || !block.rows?.length) continue;
    if (!block.rows.some(isSampleRow)) continue;
    const key = tableKey(block.columns);
    if (seen.has(key)) continue;
    let titleCount = 0;
    while (titleCount < block.rows.length && isBannerRow(block.rows[titleCount])) titleCount++;
    const titles = block.rows.slice(0, titleCount).map((row) => pad(row, block.columns!.length));
    const stored = saved.find((item) => item.type === 'table' && item.columns && tableKey(item.columns) === key);
    const data = (stored?.rows ?? []).slice(titleCount).map((row) => pad(row, block.columns!.length));
    seen.set(key, {
      key,
      columns: [...block.columns],
      titles,
      rows: data.length ? data : [blank(block.columns.length)],
    });
  }
  return [...seen.values()];
}

/** Fields that only existed to fill one example row. The table replaces them. */
export function fieldsHiddenByTables(type: AgreementTypeDto): Set<string> {
  const inRows = new Set<string>();
  const elsewhere = new Set<string>();
  const take = (text: string | null | undefined, into: Set<string>) => {
    if (!text) return;
    for (const match of text.matchAll(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g)) into.add(match[1]);
  };
  take(type.subject, elsewhere);
  take(type.legalBasis, elsewhere);
  take(type.closing, elsewhere);
  for (const block of [...type.recitals, ...type.articles]) {
    if (block.type !== 'table' || !block.rows) {
      take(block.text, elsewhere);
      continue;
    }
    const repeatable = block.rows.some(isSampleRow);
    block.columns?.forEach((column) => take(column, elsewhere));
    let titleCount = 0;
    while (titleCount < block.rows.length && isBannerRow(block.rows[titleCount])) titleCount++;
    block.rows.forEach((row, index) => {
      const into = repeatable && index >= titleCount ? inRows : elsewhere;
      row.forEach((cell) => take(cell, into));
    });
  }
  return new Set([...inRows].filter((key) => !elsewhere.has(key)));
}

/** Writes the edited rows into every copy of the table, keeping the program titles from the template. */
export function applyTableRows(blocks: AgreementBlock[], tables: EditableTable[]): AgreementBlock[] {
  if (!tables.length) return blocks;
  return blocks.map((block) => {
    if (block.type !== 'table' || !block.columns) return block;
    const table = tables.find((item) => item.key === tableKey(block.columns!));
    if (!table) return block;
    const filled = table.rows
      .map((row) => pad(row, table.columns.length))
      .filter((row) => row.some((cell) => cell.trim()));
    return { ...block, rows: [...table.titles.map((row) => [...row]), ...filled] };
  });
}
