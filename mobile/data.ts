import {
  allContent,
  request,
  type Collection,
  type Models,
  type Content,
} from "./service";
export type Snapshot = {
  supplier: Models["SupplierResponseDto"];
  profile: Models["PresenceResponseDto"] | null;
  readiness: Models["ReadinessDto"] | null;
  content: Record<Collection, Content[]>;
  modules: Models["ModuleDto"][];
};
export async function loadSnapshot(org: string): Promise<Snapshot> {
  const [supplier, profile, modules] = await Promise.all([
    request<Models["SupplierResponseDto"]>("/api/v1/core/suppliers/current", {
      org,
    }),
    request<Models["PresenceResponseDto"] | null>("/api/v1/presence/profile", {
      org,
      optional: true,
    }),
    request<Models["ModuleDto"][]>("/api/v1/core/modules", { public: true }),
  ]);
  const [readiness, portfolio, listings, gallery] = profile
    ? await Promise.all([
        request<Models["ReadinessDto"]>("/api/v1/presence/readiness", { org }),
        allContent("portfolio", org),
        allContent("listings", org),
        allContent("gallery", org),
      ])
    : [null, [], [], []];
  return {
    supplier,
    profile,
    readiness,
    content: { portfolio, listings, gallery },
    modules,
  };
}
export function active(items: Content[]) {
  return items.filter((x) => x.status !== "ARCHIVED");
}
