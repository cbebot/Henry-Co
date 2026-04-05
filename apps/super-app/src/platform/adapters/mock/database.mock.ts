import AsyncStorage from "@react-native-async-storage/async-storage";

import { DIVISION_CATALOG } from "@/domain/divisionCatalog";
import type {
  ActivityItem,
  ContactPayload,
  ContactSubmitResult,
  DatabaseAdapter,
  DbResult,
} from "@/platform/contracts/database";
import type { Division } from "@/domain/division";

const CONTACTS_KEY = "@henryco/mock_contacts_v1";

type StoredContact = ContactPayload & { id: string; at: string };

export class MockDatabaseAdapter implements DatabaseAdapter {
  async submitContact(payload: ContactPayload): Promise<ContactSubmitResult> {
    const row: StoredContact = {
      ...payload,
      id: `ct-${Date.now()}`,
      at: new Date().toISOString(),
    };
    const prev = await AsyncStorage.getItem(CONTACTS_KEY);
    const list: StoredContact[] = prev ? (JSON.parse(prev) as StoredContact[]) : [];
    list.push(row);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(list));
    return { ok: true };
  }

  async fetchDivisions(): Promise<DbResult<Division[] | null>> {
    // Use bundled catalog; same shape as remote.
    return { ok: true, data: [...DIVISION_CATALOG] };
  }

  async listActivity(limit = 8): Promise<DbResult<ActivityItem[]>> {
    const now = Date.now();
    const items: ActivityItem[] = [
      {
        id: "a1",
        title: "Marketplace order",
        subtitle: "Oro Brass Desk Lamp — mock fulfillment",
        divisionSlug: "marketplace",
        status: "completed",
        at: new Date(now - 86400000).toISOString(),
      },
      {
        id: "a2",
        title: "Fabric Care pickup",
        subtitle: "Scheduled Tuesday 10:00 — mock route",
        divisionSlug: "fabric-care",
        status: "pending",
        at: new Date(now - 172800000).toISOString(),
      },
      {
        id: "a3",
        title: "Job application",
        subtitle: "Product Designer — mock submission",
        divisionSlug: "jobs",
        status: "mock",
        at: new Date(now - 3600000).toISOString(),
      },
      {
        id: "a4",
        title: "Property viewing",
        subtitle: "Ikoyi listing — mock confirmation",
        divisionSlug: "property",
        status: "pending",
        at: new Date(now - 7200000).toISOString(),
      },
    ];
    return { ok: true, data: items.slice(0, limit) };
  }
}
