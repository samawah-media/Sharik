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

