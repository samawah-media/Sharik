const countUnitLabels = new Set([
  "item",
  "items",
  "post",
  "posts",
  "reel",
  "reels",
  "story",
  "stories",
  "design",
  "designs",
  "video",
  "videos",
  "report",
  "reports",
  "منشور",
  "منشورات",
  "ريل",
  "ريلز",
  "ستوري",
  "قصة",
  "قصص",
  "تصميم",
  "تصاميم",
  "فيديو",
  "فيديوهات",
  "تقرير",
  "تقارير",
]);

export const isCountUnitLabel = (unitLabel: string) =>
  countUnitLabels.has(unitLabel.trim().toLocaleLowerCase("ar"));

const postUnitLabels = new Set(["post", "posts", "منشور", "منشورات"]);

export const isPostPackageLine = ({
  unitLabel,
  deliverableTypeHint,
}: {
  unitLabel: string;
  deliverableTypeHint?: string;
}) => {
  const unit = unitLabel.trim().toLocaleLowerCase("ar");
  const hint = deliverableTypeHint?.trim().toLowerCase();
  if (hint && hint !== "post") return false;
  return (
    postUnitLabels.has(unit) ||
    (hint === "post" && ["item", "items"].includes(unit))
  );
};
