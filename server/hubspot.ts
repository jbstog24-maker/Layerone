/**
 * HubSpot Private App API client.
 *
 * Reads HUBSPOT_API_KEY from env. When the key is missing, every function
 * returns { ok: false, reason: "no_api_key" } without throwing, so callers
 * can queue the work in hubspot_pending_syncs instead of failing the request.
 * The API key is never logged.
 */

// TODO (Branden): confirm the "Layer One Sales Pipeline" pipeline ID and the
// "New Lead" stage ID in HubSpot at Settings > Objects > Deals > Pipelines,
// then set HUBSPOT_PIPELINE_ID and HUBSPOT_DEAL_STAGE_NEW_LEAD in the Render
// env vars. The defaults below are HubSpot's shared pipeline/stage and may
// not match your "Layer One Sales Pipeline", so new deals could land in the
// wrong pipeline until the IDs are set. Wrong IDs do not crash anything:
// HubSpot returns an error body and we log it below.

const HUBSPOT_BASE = "https://api.hubapi.com";
const FETCH_TIMEOUT_MS = 15000;

function apiKey(): string | null {
  return process.env.HUBSPOT_API_KEY || null;
}

function pipelineId(): string {
  return process.env.HUBSPOT_PIPELINE_ID || "default";
}

function newLeadStageId(): string {
  return process.env.HUBSPOT_DEAL_STAGE_NEW_LEAD || "appointmentscheduled";
}

async function hubspotFetch(path: string, method: string, body?: unknown) {
  const key = apiKey();
  if (!key) return { ok: false as const, reason: "no_api_key" as const };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${HUBSPOT_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      // Log the HubSpot error body (it never contains our API key) so a
      // wrong pipeline/stage ID is diagnosable instead of silent.
      console.error(`[HubSpot] ${method} ${path} failed:`, res.status, JSON.stringify(data)?.slice(0, 1000));
      return { ok: false as const, reason: `hubspot_${res.status}` as const, detail: JSON.stringify(data)?.slice(0, 1000) };
    }
    return { ok: true as const, data };
  } catch (err: any) {
    const reason = err?.name === "AbortError" ? "timeout" : "network_error";
    console.error(`[HubSpot] ${method} ${path} ${reason}:`, err?.message ?? err);
    return { ok: false as const, reason, detail: String(err?.message ?? err).slice(0, 500) };
  } finally {
    clearTimeout(timer);
  }
}

export type HubspotContactInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
};

export type HubspotResult = { ok: true; id: string } | { ok: false; reason: string; detail?: string };

/** Create a contact in HubSpot. Returns {ok:false, reason:"no_api_key"} when unconfigured. */
export async function createContact(input: HubspotContactInput): Promise<HubspotResult> {
  const properties: Record<string, string> = {
    email: input.email,
    firstname: input.firstName,
    lastname: input.lastName,
  };
  if (input.phone) properties.phone = input.phone;
  if (input.company) properties.company = input.company;
  const res = await hubspotFetch("/crm/v3/objects/contacts", "POST", { properties });
  if (!res.ok) return { ok: false, reason: res.reason, detail: res.detail };
  const id = res.data?.id;
  if (!id) return { ok: false, reason: "missing_id" };
  return { ok: true, id: String(id) };
}

/** Look up a contact by email; returns the HubSpot contact id or null. */
export async function findContactByEmail(email: string): Promise<string | null> {
  const res = await hubspotFetch("/crm/v3/objects/contacts/search", "POST", {
    filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
    properties: ["email"],
    limit: 1,
  });
  if (!res.ok) return null;
  const id = res.data?.results?.[0]?.id;
  return id ? String(id) : null;
}

/** Create the contact if missing (matched by email), returning the id. */
export async function ensureContact(input: HubspotContactInput): Promise<HubspotResult> {
  const created = await createContact(input);
  if (created.ok) return created;
  // Email already exists in HubSpot (409): fall back to the existing contact.
  const existingId = await findContactByEmail(input.email);
  if (existingId) return { ok: true, id: existingId };
  return created;
}

export type HubspotDealInput = {
  contactId: string;
  dealName: string;
  referrerName: string;
  referrerEmail: string;
  notes?: string | null;
};

/** Create a deal in the New Lead stage and associate it with the contact. */
export async function createDeal(input: HubspotDealInput): Promise<HubspotResult> {
  const notesLines = [
    `Referred by: ${input.referrerName} <${input.referrerEmail}>`,
  ];
  if (input.notes) notesLines.push("", input.notes);
  const res = await hubspotFetch("/crm/v3/objects/deals", "POST", {
    properties: {
      dealname: input.dealName,
      pipeline: pipelineId(),
      dealstage: newLeadStageId(),
      // Referrer info and context live on the deal description since the
      // task calls for a notes field; real notes are engagements in HubSpot.
      description: notesLines.join("\n"),
    },
  });
  if (!res.ok) return { ok: false, reason: res.reason, detail: res.detail };
  const dealId = res.data?.id;
  if (!dealId) return { ok: false, reason: "missing_id" };

  // Associate the deal with the contact using the HubSpot-defined
  // "deal_to_contact" association type (v3 type endpoint; v4 associations
  // require PUT, so v3 is the correct path for a labeled association).
  const assoc = await hubspotFetch(
    `/crm/v3/objects/deals/${dealId}/associations/contacts/${input.contactId}/types/deal_to_contact`,
    "PUT"
  );
  if (!assoc.ok) {
    console.error("[HubSpot] deal-to-contact association failed (deal created):", dealId, assoc.reason);
    // The deal itself was created, so still report success with the id.
  }
  return { ok: true, id: String(dealId) };
}

/** Whether HubSpot syncs can run right now (key configured). */
export function hubspotConfigured(): boolean {
  return !!apiKey();
}
