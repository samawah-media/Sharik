import {
  assignedInternalA,
  clientA,
  clientB,
  tenantA,
  tenantAdminA,
} from "./f001-fixtures";

export const contractA = {
  id: "contract_a",
  tenantId: tenantA.id,
  clientId: clientA.id,
  status: "active",
  name: "Client A Retainer",
};

export const packageA = {
  id: "package_a",
  tenantId: tenantA.id,
  clientId: clientA.id,
  contractId: contractA.id,
  status: "active",
  name: "Monthly Content Package",
};

export const packageLinePostsA = {
  id: "package_line_posts_a",
  tenantId: tenantA.id,
  clientId: clientA.id,
  packageId: packageA.id,
  serviceLabel: "Posts",
  unitLabel: "post",
  committedQuantity: 4,
};

export const deliverableA = {
  id: "deliverable_a",
  tenantId: tenantA.id,
  clientId: clientA.id,
  packageLineId: packageLinePostsA.id,
  name: "Launch post",
};

export const clientBPackageLine = {
  id: "package_line_client_b",
  tenantId: clientB.tenantId,
  clientId: clientB.id,
  packageId: "package_client_b",
  serviceLabel: "Reports",
  unitLabel: "report",
  committedQuantity: 1,
};

export const f002Actors = {
  tenantAdmin: tenantAdminA.authorizationActor,
  accountManagerClientA: assignedInternalA.authorizationActor,
};

