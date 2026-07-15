import type { MemberDisplay } from "@/modules/members/member-directory";

export type DeliverableVersionWorkspace = {
  id: string;
  versionNumber: number;
  status: string;
  submittedAt: string;
  submittedBy?: MemberDisplay;
  brief?: string;
  body?: string;
  caption?: string;
  channel?: string;
  format?: string;
  objective?: string;
  kpi?: string;
  sourceReference?: string;
};
export type DeliverableTaskWorkspace = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  assigneeUserId?: string;
  assignee?: MemberDisplay;
  dueDate?: string;
  sortOrder: number;
};

export type DeliverableFileWorkspace = {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  visibility: string;
  versionId?: string;
  versionNumber: number;
  isFinal: boolean;
  createdAt: string;
};

export type DeliverableCommentWorkspace = {
  id: string;
  versionId?: string;
  type: string;
  visibility: "internal_only" | "client_visible";
  body: string;
  bodyFormat: "plain_text" | "tiptap_json";
  bodyJson?: unknown;
  author?: MemberDisplay;
  createdAt: string;
};

export type DeliverableQualityWorkspace = {
  id: string;
  versionId: string;
  label: string;
  status: "pending" | "passed" | "changes_required" | "not_applicable";
  note?: string;
  checkedBy?: MemberDisplay;
  checkedAt?: string;
  sortOrder: number;
};

export type DeliverableActivityWorkspace = {
  id: string;
  kind: "version" | "comment" | "approval" | "sla" | "audit";
  label: string;
  createdAt: string;
  actor?: MemberDisplay;
};

export type TaskCapabilities = {
  canCreateTask: boolean;
  canAssignOthers: boolean;
  canReassignTask: boolean;
  canUpdateOwnTaskStatus: boolean;
  canDeleteTask: boolean;
  canEditTaskFields: boolean;
};

export type DeliverableWorkspace = {
  deliverableId: string;
  currentActorUserId?: string;
  currentVersionId?: string;
  versions: DeliverableVersionWorkspace[];
  tasks: DeliverableTaskWorkspace[];
  files: DeliverableFileWorkspace[];
  comments: DeliverableCommentWorkspace[];
  qualityChecks: DeliverableQualityWorkspace[];
  activity: DeliverableActivityWorkspace[];
  eligibleAssignees: MemberDisplay[];
  taskCapabilities: TaskCapabilities;
  counts: {
    versions: number;
    tasks: number;
    files: number;
    comments: number;
  };
};

export function canUpdateTaskStatus(
  workspace: Pick<
    DeliverableWorkspace,
    "currentActorUserId" | "taskCapabilities"
  >,
  task: Pick<DeliverableTaskWorkspace, "assigneeUserId">,
) {
  const canEditTask =
    workspace.taskCapabilities.canEditTaskFields ||
    workspace.taskCapabilities.canReassignTask;

  return (
    canEditTask ||
    (workspace.taskCapabilities.canUpdateOwnTaskStatus &&
      task.assigneeUserId === workspace.currentActorUserId)
  );
}

export type DeliverableWorkspaceSummary = {
  deliverableId: string;
  currentVersionId?: string;
  counts: {
    versions: number;
    tasks: number;
    files: number;
    comments: number;
  };
};
