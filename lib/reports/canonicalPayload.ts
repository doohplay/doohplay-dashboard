export function buildCanonicalPayload(closure: any) {
  return {
    closure_id: closure.id,
    tenant_id: closure.tenant_id,
    report_code: closure.report_code,
    year: closure.year,
    month: closure.month,
    started_at: closure.started_at,
    ended_at: closure.ended_at,
    version: closure.version
  }
}
