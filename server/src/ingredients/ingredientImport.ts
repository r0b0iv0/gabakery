import { unzipSync } from 'fflate';

export type IngredientImportRow = {
  rowNumber: number;
  name: string;
  unit: string;
  rawQuantity: string;
};

const MAX_XLSX_XML_SIZE = 5 * 1024 * 1024;

function decodeXml(value: string): string {
  return value
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([\w:.-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    attributes[match[1]] = decodeXml(match[2]);
  }

  return attributes;
}

function decodeUtf8(value: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(value);
}

function parseCsv(text: string): string[][] {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0)
    ? ';'
    : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function getCellColumn(cellReference: string): number {
  const letters = cellReference.match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) return -1;

  return [...letters].reduce((column, letter) => column * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function getWorkbookEntryPath(entries: Record<string, Uint8Array>): string {
  const workbookXml = entries['xl/workbook.xml'];
  const relationshipsXml = entries['xl/_rels/workbook.xml.rels'];

  if (!workbookXml || !relationshipsXml) {
    throw new Error('Файлът не изглежда като Excel работна книга.');
  }

  const firstSheet = decodeUtf8(workbookXml);
  const sheetMatch = /<sheet\b([^>]*)\/?\s*>/i.exec(firstSheet);
  const relationshipId = sheetMatch && parseAttributes(sheetMatch[1])['r:id'];

  if (!relationshipId) {
    throw new Error('Excel файлът няма работен лист.');
  }

  const relationships = decodeUtf8(relationshipsXml);
  const relationshipPattern = /<Relationship\b([^>]*)\/?\s*>/gi;
  let relationshipMatch: RegExpExecArray | null;

  while ((relationshipMatch = relationshipPattern.exec(relationships)) !== null) {
    const attributes = parseAttributes(relationshipMatch[1]);
    if (attributes.Id !== relationshipId) continue;

    const target = attributes.Target?.replace(/^\//, '');
    if (!target) break;

    const resolvedTarget = target.startsWith('xl/') ? target : `xl/${target}`;
    if (entries[resolvedTarget]) return resolvedTarget;
    break;
  }

  throw new Error('Неуспешно зареждане на първия работен лист в Excel файла.');
}

function parseXlsx(buffer: Buffer): string[][] {
  let extractedXmlSize = 0;
  const entries = unzipSync(buffer, {
    filter: (file) => {
      const isNeeded = file.name === 'xl/workbook.xml' ||
        file.name === 'xl/_rels/workbook.xml.rels' ||
        file.name === 'xl/sharedStrings.xml' ||
        /^xl\/worksheets\/[^/]+\.xml$/.test(file.name);

      if (!isNeeded) return false;
      extractedXmlSize += file.originalSize;

      if (extractedXmlSize > MAX_XLSX_XML_SIZE) {
        throw new Error('Excel файлът е прекалено голям след разархивиране.');
      }

      return true;
    },
  });

  const sheetPath = getWorkbookEntryPath(entries);
  const worksheetBytes = entries[sheetPath];
  const worksheetXml = worksheetBytes ? decodeUtf8(worksheetBytes) : null;
  if (!worksheetXml) throw new Error('Excel файлът няма данни в първия лист.');

  const sharedStrings: string[] = [];
  const sharedStringsBytes = entries['xl/sharedStrings.xml'];
  const sharedStringsXml = sharedStringsBytes ? decodeUtf8(sharedStringsBytes) : undefined;
  if (sharedStringsXml) {
    const stringPattern = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    let stringMatch: RegExpExecArray | null;
    while ((stringMatch = stringPattern.exec(sharedStringsXml)) !== null) {
      const textParts = [...stringMatch[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)];
      sharedStrings.push(textParts.map((part) => decodeXml(part[1])).join(''));
    }
  }

  const rows: string[][] = [];
  const rowPattern = /<row\b([^>]*)>([\s\S]*?)<\/row>/g;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(worksheetXml)) !== null) {
    const rowNumber = Number(parseAttributes(rowMatch[1]).r) || rows.length + 1;
    const cells: string[] = [];
    const cellPattern = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellPattern.exec(rowMatch[2])) !== null) {
      const attributes = parseAttributes(cellMatch[1]);
      const column = getCellColumn(attributes.r ?? '');
      if (column < 0) continue;

      const content = cellMatch[2] ?? '';
      const inlineText = /<is\b[^>]*>([\s\S]*?)<\/is>/i.exec(content)?.[1];
      const value = /<v\b[^>]*>([\s\S]*?)<\/v>/i.exec(content)?.[1];
      let cellValue = '';

      if (attributes.t === 'inlineStr' && inlineText !== undefined) {
        cellValue = [...inlineText.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
          .map((part) => decodeXml(part[1]))
          .join('');
      } else if (attributes.t === 's' && value !== undefined) {
        cellValue = sharedStrings[Number(value)] ?? '';
      } else if (value !== undefined) {
        cellValue = decodeXml(value);
      }

      cells[column] = cellValue;
    }

    rows[rowNumber - 1] = cells;
  }

  return rows;
}

function normalizeHeader(value: string): string {
  return value.trim().replace(/^\uFEFF/, '').toLocaleLowerCase('en-US');
}

export async function parseIngredientImport(
  buffer: Buffer,
  fileName: string,
): Promise<IngredientImportRow[]> {
  const extension = fileName.toLocaleLowerCase('en-US').split('.').pop();
  let rows: string[][];

  if (extension === 'csv') {
    let content: string;
    try {
      content = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      throw new Error('CSV файлът трябва да е в UTF-8 формат.');
    }
    rows = parseCsv(content.replace(/^\uFEFF/, ''));
  } else if (extension === 'xlsx') {
    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
      throw new Error('Файлът няма валиден XLSX формат.');
    }
    rows = parseXlsx(buffer);
  } else {
    throw new Error('Изберете Excel файл (.xlsx) или CSV файл (.csv).');
  }

  const headerIndex = rows.findIndex((row) => row.some((cell) => cell?.trim()));
  if (headerIndex < 0) throw new Error('Файлът е празен.');

  const headers = rows[headerIndex].map(normalizeHeader);
  const nameColumn = headers.findIndex((value) => ['ingredient name', 'name', 'име на съставката', 'съставка'].includes(value));
  const unitColumn = headers.findIndex((value) => ['unit', 'мерна единица'].includes(value));
  const quantityColumn = headers.findIndex((value) => ['quantity received', 'received quantity', 'quantity', 'получено количество', 'количество'].includes(value));

  if (nameColumn < 0 || unitColumn < 0 || quantityColumn < 0) {
    throw new Error('Необходими колони: Ingredient name, Unit и Quantity received.');
  }

  const parsedRows: IngredientImportRow[] = [];
  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const row = rows[index] ?? [];
    const name = (row[nameColumn] ?? '').trim();
    const unit = (row[unitColumn] ?? '').trim();
    const rawQuantity = (row[quantityColumn] ?? '').trim();
    if (!name && !unit && !rawQuantity) continue;

    parsedRows.push({
      rowNumber: index + 1,
      name,
      unit,
      rawQuantity,
    });
  }

  if (parsedRows.length === 0) throw new Error('Добавете поне един ред със съставка.');
  if (parsedRows.length > 500) throw new Error('Един файл може да съдържа най-много 500 реда със съставки.');

  return parsedRows;
}
