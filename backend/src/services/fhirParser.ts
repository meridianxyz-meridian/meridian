/**
 * FHIR parsing service — converts hospital FHIR bundles into Meridian's record format.
 * Supports FHIR R4 JSON bundles (the format most US hospitals export via 21st Century Cures Act).
 */

export interface ParsedRecord {
  type: string;
  date: string;
  content: string;
  source: string;
  rawFhirType?: string;
}

/** Parse a FHIR R4 Bundle JSON into flat Meridian records. */
export function parseFhirBundle(bundle: any): ParsedRecord[] {
  if (bundle.resourceType !== 'Bundle') {
    throw new Error('Not a FHIR Bundle');
  }

  const records: ParsedRecord[] = [];
  const entries: any[] = bundle.entry ?? [];

  for (const entry of entries) {
    const resource = entry.resource;
    if (!resource) continue;

    const parsed = parseResource(resource);
    if (parsed) records.push(parsed);
  }

  return records.sort((a, b) => a.date.localeCompare(b.date));
}

function parseResource(resource: any): ParsedRecord | null {
  switch (resource.resourceType) {
    case 'Observation':
      return parseObservation(resource);
    case 'MedicationRequest':
      return parseMedicationRequest(resource);
    case 'Condition':
      return parseCondition(resource);
    case 'DiagnosticReport':
      return parseDiagnosticReport(resource);
    case 'Encounter':
      return parseEncounter(resource);
    default:
      return null;
  }
}

function parseObservation(r: any): ParsedRecord {
  const code = r.code?.text ?? r.code?.coding?.[0]?.display ?? 'Observation';
  const date = r.effectiveDateTime ?? r.issued ?? 'unknown';
  const value = r.valueQuantity
    ? `${r.valueQuantity.value} ${r.valueQuantity.unit}`
    : r.valueString ?? r.valueCodeableConcept?.text ?? 'see record';

  return {
    type: 'lab',
    date: date.slice(0, 10),
    content: `${code}: ${value}`,
    source: r.performer?.[0]?.display ?? 'Hospital',
    rawFhirType: 'Observation',
  };
}

function parseMedicationRequest(r: any): ParsedRecord {
  const med = r.medicationCodeableConcept?.text ??
    r.medicationCodeableConcept?.coding?.[0]?.display ?? 'Medication';
  const date = r.authoredOn ?? 'unknown';
  const dosage = r.dosageInstruction?.[0]?.text ?? '';

  return {
    type: 'prescription',
    date: date.slice(0, 10),
    content: `Prescribed: ${med}${dosage ? ` — ${dosage}` : ''}`,
    source: r.requester?.display ?? 'Provider',
    rawFhirType: 'MedicationRequest',
  };
}

function parseCondition(r: any): ParsedRecord {
  const condition = r.code?.text ?? r.code?.coding?.[0]?.display ?? 'Condition';
  const date = r.onsetDateTime ?? r.recordedDate ?? 'unknown';
  const status = r.clinicalStatus?.coding?.[0]?.code ?? 'active';

  return {
    type: 'diagnosis',
    date: date.slice(0, 10),
    content: `Diagnosis: ${condition} (${status})`,
    source: r.recorder?.display ?? 'Provider',
    rawFhirType: 'Condition',
  };
}

function parseDiagnosticReport(r: any): ParsedRecord {
  const title = r.code?.text ?? r.code?.coding?.[0]?.display ?? 'Report';
  const date = r.effectiveDateTime ?? r.issued ?? 'unknown';
  const conclusion = r.conclusion ?? 'See attached report';

  return {
    type: 'imaging',
    date: date.slice(0, 10),
    content: `${title}: ${conclusion}`,
    source: r.performer?.[0]?.display ?? 'Radiology',
    rawFhirType: 'DiagnosticReport',
  };
}

function parseEncounter(r: any): ParsedRecord {
  const type = r.type?.[0]?.text ?? r.class?.display ?? 'Visit';
  const date = r.period?.start ?? 'unknown';
  const reason = r.reasonCode?.[0]?.text ?? '';

  return {
    type: 'visit',
    date: date.slice(0, 10),
    content: `${type}${reason ? `: ${reason}` : ''}`,
    source: r.serviceProvider?.display ?? 'Hospital',
    rawFhirType: 'Encounter',
  };
}
