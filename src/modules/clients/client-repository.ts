export type ClientStatus = "active" | "archived";

export type ClientRecord = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  status: ClientStatus;
  primaryContactName?: string;
  primaryContactEmail?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
};

export type ClientCreateInput = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  createdBy: string;
};

export type ClientUpdateInput = {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  expectedRevision: number;
};

export type ClientRepository = {
  create(input: ClientCreateInput): Promise<ClientRecord>;
  update(input: ClientUpdateInput): Promise<ClientRecord | undefined>;
  findByTenantAndId(tenantId: string, id: string): Promise<ClientRecord | undefined>;
  findByTenantAndSlug(tenantId: string, slug: string): Promise<ClientRecord | undefined>;
  listByTenant(tenantId: string): Promise<ClientRecord[]>;
};

export class InMemoryClientRepository implements ClientRepository {
  private readonly clients = new Map<string, ClientRecord>();

  constructor(initialClients: ClientRecord[] = []) {
    for (const client of initialClients) {
      this.clients.set(client.id, client);
    }
  }

  async create(input: ClientCreateInput) {
    const now = new Date().toISOString();
    const record: ClientRecord = {
      ...input,
      status: "active",
      createdAt: now,
      updatedAt: now,
      revision: 1,
    };

    this.clients.set(record.id, record);
    return record;
  }

  async update(input: ClientUpdateInput) {
    const existing = await this.findByTenantAndId(input.tenantId, input.id);

    if (!existing || existing.revision !== input.expectedRevision) {
      return undefined;
    }

    const updated: ClientRecord = {
      ...existing,
      name: input.name,
      slug: input.slug,
      primaryContactName: input.primaryContactName,
      primaryContactEmail: input.primaryContactEmail,
      updatedAt: new Date().toISOString(),
      revision: existing.revision + 1,
    };

    this.clients.set(updated.id, updated);
    return updated;
  }

  async findByTenantAndId(tenantId: string, id: string) {
    const client = this.clients.get(id);
    return client?.tenantId === tenantId ? client : undefined;
  }

  async findByTenantAndSlug(tenantId: string, slug: string) {
    return Array.from(this.clients.values()).find(
      (client) => client.tenantId === tenantId && client.slug === slug,
    );
  }

  async listByTenant(tenantId: string) {
    return Array.from(this.clients.values())
      .filter((client) => client.tenantId === tenantId)
      .sort((left, right) => left.name.localeCompare(right.name, "ar"));
  }
}

export const toClientSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
