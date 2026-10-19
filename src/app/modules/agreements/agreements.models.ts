export type BlockType = 'paragraph' | 'article' | 'table';

export interface AgreementBlock {
  type: BlockType;
  text?: string | null;
  columns?: string[] | null;
  rows?: string[][] | null;
}

export interface AgreementField {
  key: string;
  label: string;
  labelEn: string;
  example: string;
}

export interface AgreementTypeDto {
  code: string;
  name: string;
  nameEn: string;
  subject: string;
  legalBasis: string;
  closing: string;
  fields: AgreementField[];
  recitals: AgreementBlock[];
  articles: AgreementBlock[];
}

export interface AgreementPayload {
  typeCode: string;
  number: number | null;
  issueDate: string;
  subject: string;
  councilTitle: string;
  legalBasis: string;
  closing: string;
  presidentName: string;
  secretaryName: string;
  values: Record<string, string>;
  recitals: AgreementBlock[];
  articles: AgreementBlock[];
}

export interface AgreementDto extends AgreementPayload {
  id: number;
  label: string;
  number: number;
  year: number;
  typeName: string;
  facultyId: number;
  faculty: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface AgreementSummaryDto {
  id: number;
  label: string;
  number: number;
  year: number;
  typeCode: string;
  typeName: string;
  faculty: string;
  issueDate: string;
  subject: string;
  createdBy: string;
}

export interface AgreementDefaultsDto {
  facultyId: number;
  faculty: string;
  year: number;
  nextNumber: number;
  councilTitle: string;
  city: string;
  presidentName: string;
  secretaryName: string;
}
