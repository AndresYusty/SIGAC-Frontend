export interface TemplateVariableDto {
  name: string;
  type: string;
  description: string;
  example: string;
}

export interface TemplateDto {
  id: number;
  name: string;
  councilTypeId: number;
  councilTypeName: string;
  facultyId: number | null;
  facultyName: string | null;
  version: number;
  active: boolean;
  comment: string | null;
  createdBy: string;
  createdAt: string;
  content: string | null;
}

export interface TemplatePayload {
  councilTypeId: number;
  facultyId: number | null;
  name: string;
  content: string;
  comment: string;
}
