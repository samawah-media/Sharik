# Astra-led correction queue — 2026-09-07

## Owner authorization and next wave — 2026-09-13

- Owner acceptance is recorded for the published SIL-55 and SIL-57 corrections only. Their unexecuted hosted save/mutation checks remain honestly pending; no overall release acceptance is inferred.
- The owner explicitly authorized task-bounded transmission of the files named in each brief to the saved Z.ai/GLM route. The first SIL-09 read-only attempt selected `zai-coding-plan/glm-4.7`, but external safety review still rejected that exact dispatch before transmission and required separate payload confirmation. No project file was sent, no model result exists, and reported usage/cost remain unknown.
- Next priority wave: reconcile SIL-09 against the already-present bounded-scroll/RTL/media-containment implementation and real hosted behavior; independently shape SIL-66 before code because it changes count-unit operational semantics. The lead retains canonical docs, integration, tests, commit/push/deploy and acceptance.

### SIL-06 / SIL-09 reconciliation and SIL-66 implementation

- SIL-06 and SIL-09 were reconciled against source, focused tests and the exact-head CI/Preview ancestry. Both already have technical corrections; their stale `Open` labels were replaced with honest technical-published states while desktop/mobile hosted rechecks remain pending.
- Native agent `01a099ad-f01e-7991-961a-2f324e93992a` first performed a read-only SIL-66 product/architecture audit, then implemented the bounded next-unit guidance with TDD. No recursive delegation occurred.
- Independent `gpt-5.6-sol` reviewer `01a099bb-f470-7330-adc4-523092f20c0a` returned HOLD twice: first for `deliverables[0]`/generic success misidentification and latest-package substitution risk, then for using the proposed UUID instead of the persisted idempotent RPC result. Both were corrected with new RED/GREEN regressions. Final reviewer verdict: APPROVE, no actionable findings.
- Lead-fresh SIL-66 evidence before first push: focused component 21/21, focused unit 4/4, full unit 80/504, full component 45/371, integration 28/113, full TypeScript, full ESLint, production build and diff check PASS. Commit `2df8938` was pushed for exact-head CI run `34748220268`. That run passed whitespace, install, lint, typecheck, unit, integration, disposable Supabase reset/RLS and component gates, then failed before fixture E2E assertions because a server page imported pure helpers from the `use client` form module. The corrective work moves only those pure helpers into `src/modules/deliverables/count-unit-guidance.ts`; post-correction lead checks are focused unit 4/4, focused component 21/21, TypeScript, ESLint, production build and diff check PASS. Independent `gpt-5.6-sol` low reviewer `01a09a14-1e49-7ed3-aa6d-d0e0290af240` returned APPROVE with no findings on the bounded server/client extraction; its own slow lint was interrupted, so the lint evidence remains the lead's completed run. Replacement CI is pending; no Preview, hosted behavior or owner acceptance is claimed yet.

## Current reconciliation wave — X010-B-7C-23 — 2026-09-12

### Current batch — SIL-57 CI/Preview PASS, hosted mutation pending

The lead reviewed the current local implementation and corrective diff. SIL-55
and SIL-56 publication records below remain intact. The first SIL-57 exact-head
CI exposed a real feedback regression; replacement run `34712402420` succeeded
on exact HEAD `2c7b00f81504a9a5fdaf5f36cedb2f970e782ecb`, and its source-git Preview is
READY. Hosted mutation and owner acceptance remain pending.

| Slice | Model / mode | State / review | Checks | Revisions / usage |
| --- | --- | --- | --- | --- |
| SIL-57 | Native `gpt-5.6-luna`, medium effort; agent `01a096bf-ced0-7de0-88aa-405385b309b1`; independent Native `gpt-5.6-sol`, low reviewer `01a096c7-524a-7cc3-965c-81a7b6528aef` | LOCAL PASS with exact-head CI SUCCESS and Preview READY; hosted mutation and owner acceptance pending; not fully closed | Initial worker RED: unit 1 expected failure; component 2 expected failures. CI `34710511672`: persistent E2E 21 pass / 2 fail / 1 not run. First post-CI RED 4 component failures / 29 pass → focused 2 files / 33 PASS. Lead then ran full unit 79/501, full component 45/355, typecheck, lint, build and diff-check PASS. Second lifecycle RED 2 failed / 32 passed → focused 2 files / 35 PASS; lead-fresh after it: focused 35/35 + diff-check PASS only. Replacement CI `34712402420` SUCCESS on exact HEAD `2c7b00f81504a9a5fdaf5f36cedb2f970e782ecb`; all gates including persistent E2E, secret scan and build PASS | One lead-requested test refinement; reviewer initial HOLD → APPROVED, post-CI HOLD → final APPROVED with no actionable findings; usage/cost unknown |

- **Root cause:** `versionStatusLabel` omitted persisted `internal_only`, `final`
  and `superseded`. The open drawer also held stale local workspace after save
  because `VersionContentForm` called only `router.refresh()`.
- **Implementation:** maps the three persisted states to Arabic labels;
  `VersionContentForm` invokes optional `onMutated` only on successful mutation,
  and the drawer wires it to `handleMutated` to refresh its local workspace.
- **Independent review and correction:** Native `gpt-5.6-sol` low reviewer
  `01a096c7-524a-7cc3-965c-81a7b6528aef` initially HOLDed because the immediate
  refresh could use stale `currentVersionId` and the test proved only that a
  fetch occurred. The corrected success path passes the persisted `versionId`
  into the immediate drawer refresh. Its regression asserts the exact fetched
  ID and replacement of the old body by the new version, body and localized
  status. The same reviewer re-reviewed and APPROVED with no actionable findings.
- **Exact-head CI:** F-001 run `34710511672` on
  `767bf11f4f59c6272455d007f85ad5983bc48b62` failed at
  `test:e2e:persistent` after 21 pass / 2 fail / 1 not run. Both failures expected
  visible «تم إرسال النسخة للمراجعة الداخلية.» after submission. This exposed
  a real UI regression: immediate workspace refresh removed the form feedback.
- **Post-CI correction:** tests first produced 4 component failures / 29 pass.
  Version-success feedback now lives in the drawer header with `aria-live`, while
  explicit refresh by the successfully persisted version ID remains and no timer
  is introduced. The implementer reported focused component 2 files / 33 tests,
  typecheck, lint and diff-check PASS; the lead independently reran focused
  component 33/33 PASS. After this first post-CI correction, the lead also ran
  full unit 79/501, full component 45/355, full typecheck, full lint, production
  build and git diff check PASS.
- **Post-CI lifecycle review and second correction:** the same reviewer HOLDed
  because stale success could remain after a later failed save and the regression
  lacked success→failure coverage. Second corrective TDD RED was 2 failed / 32
  passed; GREEN focused component was 2 files / 35 tests. `onMutationStarted`
  clears lifted feedback before every attempt without refresh. A failed save
  retains its local failure and calls neither `onMutated` nor refresh. Close/reopen
  reset is covered, and exact persisted-version-ID refresh remains preserved.
  The same reviewer re-reviewed and APPROVED with no actionable findings.
- **Evidence freshness:** after the second lifecycle correction, the lead freshly
  ran focused component 35/35 and git diff check PASS only. The full unit 79/501,
  full component 45/355, full typecheck, full lint and production build PASS were
  run after the first post-CI correction, not after the second. Full integration
  28/113 and focused unit 1/7 remain earlier local evidence. No database result is
  claimed, and the failed persistent E2E has not been rerun.
- **Publication:** replacement GitHub Actions run `34712402420` completed
  **SUCCESS** on exact HEAD `2c7b00f81504a9a5fdaf5f36cedb2f970e782ecb`.
  Every gate passed, including persistent E2E, secret scan and build. Source-git
  Vercel Preview `dpl_7yVJmytN6EJctnMgVdJHUxm4kzv5` is **READY** on the exact
  same SHA. Branch alias:
  https://shrik-git-codex-preview-ui-batch-20260912-samawahs-projects.vercel.app.
  Hosted page smoke load succeeded.
- **Hosted / acceptance:** the page-load smoke is not a SIL-57 mutation recheck.
  Hosted mutation and owner acceptance remain pending; SIL-57 is not fully
  closed and no acceptance checkbox is changed. SIL-55 hosted save recheck also
  remains blocked by current sample package capacity 0.

### SIL-55 read-only audit routing record

- `zai-coding-plan/glm-4.7` was selected for a SIL-55 read-only audit, but an
  external-source safety review blocked execution before payload transmission.
  There is no GLM result and no GLM usage claim.
- Native `gpt-5.6-luna` low audit agent
  `01a096bc-d410-7232-bfeb-d8babd133030` returned code-level SIL-55 PASS. The
  lead independently reran the focused file: 1 file / 7 tests PASS.
- SIL-55 hosted save verification remains blocked by current sample package
  capacity 0; owner acceptance remains pending. This audit note does not alter
  the preserved SIL-55 technical publication evidence below.

### Current batch — SIL-56 technically published, acceptance pending

SIL-56 technical publication is complete on canonical exact HEAD
`7a262f4378008df5a5f29aef6b20449ab111d65f`: F-001 run `34703646855` is
**SUCCESS** and the source-git Preview is **READY**. Hosted behavioral recheck
and owner acceptance remain pending. The preceding SIL-55 publication evidence
below is preserved unchanged and its acceptance gates also remain open.

| Slice | Model / mode | State / review | Checks | Revisions / usage |
| --- | --- | --- | --- | --- |
| SIL-56 | Native `gpt-5.6-luna`, low effort; agent `01a0961a-7616-7002-b223-8b077e5bfb19` | Technical implementation committed, exact-head CI successful and Preview ready; hosted behavior and owner acceptance pending | Focused 1 file / 15 tests PASS after a small wording refinement; full component 45 files / 353 tests PASS; full lint, full typecheck, production build and git diff check PASS; F-001 `34703646855` SUCCESS | Worker-reported 34/34 is not accepted; record only lead-confirmed results; commit `7a262f4`; usage/cost unknown |

- **Implementation:** SIL-56 changes the `not_started` next-step guidance from
  «بدء التنفيذ» to «ابدأ بالمحتوى، ثم احفظ مسودة أو أرسلها للمراجعة».
- **Local:** lead confirmed focused 1 file / 15 tests and full component 45 files /
  353 tests PASS, plus full lint, full typecheck, production build and git diff
  check PASS. No unit or integration result is claimed for SIL-56. These are
  local results, not CI, Preview, hosted verification or owner acceptance.
- **CI / publication:** commit `7a262f4` has message
  `fix: clarify first deliverable action`. F-001 Quality run `34703646855`
  completed **SUCCESS** on canonical exact HEAD
  `7a262f4378008df5a5f29aef6b20449ab111d65f`.
- **Preview:** source-git deployment `dpl_EQDG8tbZXMLmJSucyHEUdLmZWxZJ` is
  **READY** on the exact SHA. Immutable URL:
  https://shrik-5dwhs9k8i-samawahs-projects.vercel.app. Branch alias:
  https://shrik-git-codex-preview-ui-batch-20260912-samawahs-projects.vercel.app.
  The protected Preview responded with the expected Vercel-auth 302; this is an
  access-protection preflight, not a SIL-56 behavioral recheck.
- **PR:** PR #38 was closed without merge after the evidence comment; canonical
  PR #37 remains open.
- **Hosted / owner:** no SIL-56 hosted behavioral recheck or owner acceptance
  exists, so SIL-56 is not fully closed.
- **Classification:** leave aggregate counts pending reconciliation; do not
  promote technical publication to owner acceptance.

This final documentation-only update is local and uncommitted. It is intended
to be included with the next implementation batch, avoiding a third full CI run
solely for evidence metadata.

### Preceding batch — SIL-55 technically published, acceptance pending

Canonical branch exact HEAD after the test-only correction is
`3859ad4fce4f79420e5aff8f4be82be43446f778`. Results below are supplied by the
lead and recorded by the steward.

| Slice | Model / mode | State / review | Checks | Revisions / usage |
| --- | --- | --- | --- | --- |
| SIL-55 | Native `gpt-5.6-luna`, low effort; agent `01a095f2-1dc9-72c3-93cf-73873df87a20` | Technical implementation committed, exact-head CI successful and Preview ready; hosted behavior and owner acceptance pending | Focused Vitest 7/7 PASS; full component 45 files / 352 tests PASS; unit 79 files / 501 tests PASS; integration 28 files / 113 tests PASS; full lint, typecheck, production build and diff checks PASS; F-001 `34702118292` SUCCESS | One lead-requested worker revision plus one lead test-type correction; test-only E2E correction `3859ad4`; usage/cost unknown |

- **Implementation:** bounded to `src/ui/management/deliverable-form.tsx` and
  `tests/component/deliverables/deliverable-form.test.tsx`; the canonical branch
  contains the SIL-55 implementation at exact HEAD
  `3859ad4fce4f79420e5aff8f4be82be43446f778` after the test correction.
- **Local:** only the checks recorded in the ledger above are claimed for SIL-55;
  no hosted or visual result is claimed in this update. An initial parallel unit
  run timed out in two fixture-boundary tests under concurrent build load; the
  complete unit suite then passed 501/501 when rerun alone.
- **CI / publication:** first exact-head run `34700421494` failed only because
  persistent E2E attempted to fill the new hidden readonly `input[name=type]`
  and timed out; the product implementation and local tests were not the cause.
  Test-only corrective commit `3859ad4` updated the two E2E points to assert the
  visible Arabic «منشور» and hidden canonical `post`. Replacement F-001 run
  `34702118292` completed **SUCCESS** on exact HEAD
  `3859ad4fce4f79420e5aff8f4be82be43446f778`.
- **Preview:** source-git deployment `dpl_BSB7rafsZLZjNgGfR6PrFQeTPkXN` is
  **READY** on exact SHA `3859ad4`. Immutable URL:
  https://shrik-jmlchlr5r-samawahs-projects.vercel.app. Branch alias:
  https://shrik-git-codex-preview-ui-batch-20260912-samawahs-projects.vercel.app.
  PR #38 was closed without merge after deployment; canonical PR remains #37.
- **Hosted:** no SIL-55 hosted behavioral recheck is established.
- **Owner:** no SIL-55 owner acceptance is established.

Earlier shipped checkpoint: commit `eb7b783`; F-001 run `34697922090`
**SUCCESS**; Vercel Preview `dpl_8sUW8usRkXsP1fF3y9ha9yJwkb1m` **READY**.
That checkpoint is retained as historical evidence and does not replace the
newer SIL-55 exact-head publication above. Preview READY does not establish
hosted behavioral verification or owner acceptance. Prior snapshots and
inventory counts are retained below; aggregate reclassification awaits explicit
lead reconciliation.
Documentation steward returns to idle/reusable after this queue-only update;
no commit, push, deploy or further delegation is performed.

### Current status — R23-D / SIL-06 locally accepted

Lead-authorized classification: **52 unimplemented, 10 pending verification/acceptance,
9 decision/investigation, 2 narrowly verified; total 73**. SIL-06 moves from
unimplemented to pending after local acceptance; SIL-59/SIL-63 remain pending.
Older counts and assignment statements below are preserved historical snapshots.

Lead-reported evidence, recorded by the steward (not rerun here):

- **Implementation:** lead reviewed the actual three-file diff. Drawer header uses
  the existing authorized client name/fallback; MyTasks maps the correct clientId.
  No permission or fetch changes. Curie's bounded implementation is locally complete.
- **Local:** worker RED 5 fail / 21 pass → GREEN 26; lead independently ran focused
  26/26 PASS, TypeScript PASS and scoped ESLint PASS. CSS review was source-only;
  visual verification remains pending. Exact acceptance revision/run IDs pending lead.
- **CI:** no rerun; latest recorded 34694447510 remains FAILED six directory tests.
  The local assertion correction remains pending rerun; no SIL-06 CI pass is implied.
- **Hosted:** pending for SIL-06; no publication or hosted verification claimed.
- **Owner:** pending; no owner-acceptance item closed.

### الحصر الموحد للملاحظات — نقطة البداية

راجع الوكيل سجل العيوب وقائمة تجربة المالك والمهام والكود على61da798.
الحصر يشمل SIL-01 إلى SIL-73 بلا فجوات: 55 بندًا لم يثبت اكتمال تنفيذها،
7 بنود موجودة/منفذة وتحتاج تحققًا، 9 قرارات أو تحقيقات، وبندان ناجحان في
سيناريو مستضاف محدد. الأرقام تخص معرفات SIL لا عدد مهام البرمجة؛ نجمع المتداخل
في حزم مع الاحتفاظ بكل معيار قبول. SIL-59 وSIL-63 انتقلا أثناء هذه الجولة
إلى تنفيذ محلي مقبول بالمراجعة، ولا يعني ذلك نجاح تجربة المالك.
الحالة بعد R23-B: 53 لم يثبت تنفيذها، 9 تنتظر التحقق/القبول، 9 قرارات/تحقيقات،
وبندان ناجحان مستضافًا ضمن نطاقهما. لم يُغلق أي بند قبول مالك بهذه الجولة.

المصادر: [سجل العيوب](defect-register.md)،
[تجربة المالك](owner-acceptance-walkthrough-ar.md)، [المهام](../tasks.md).
الحالات التاريخية لا تُحذف؛ هذا القسم هو طابور التنفيذ الحالي.

| الحزمة | معرفات SIL | المتبقي | الاعتماد/التبعية |
| --- | --- | --- | --- |
| هوية وسياق العمل | 06،10،16 | اسم العميل داخل مساحة المخرج، وهوية ودور المستخدم، وضوح جلسة التبويب القديم | الأولوية التالية بعد البوابات الحالية؛ لا توسيع صلاحيات |
| إدخال العميل والباقة | 01،17،18،19،20 | شرح أول مخرج والخدمة والوحدة، تخصيص الخدمة ومراجعة الحجز، إرشاد ما بعد الإنشاء وعناوين المواعيد | خطة مستقلة؛ لا تغيير محاسبة الباقة ضمن تصحيح النص |
| الأعداد وأنواع الأعمال | 02،07،45،55 | فصل عدد البطاقات عن المتفق والمنفذ والظاهر للعميل؛ حفظ نوع المخرج القياسي | فصل55 كإصلاح بيانات إدخال عن تسميات الأعداد |
| رحلة الفريق | 12،14،15،34،56،58،69،70 | الخطوة المناسبة للدور، مهامي/عملائي، ترتيب الأولويات والروابط المسموحة | تصميم واجهة ضمن الصلاحيات الحالية، لا منح صلاحيات لتجاوز رفض |
| البحث | 11 | تطبيع التشكيل في البحث العربي | مستقل بعد تحديد حقول البحث |
| محتوى واضح | 13،59،63 | أمثلة الموجز/المحتوى/الكابشن وتخفيف الحقول؛ نص العميل المشاهد | 59/63 مقبولان محليًا في R23-B وينتظران القبول المستضاف؛ تقليل الحقول في13 ما زال لاحقًا |
| المهام والمصمم | 22،23،24،26،27،28 | حفظ بلا فقد السياق، ظهور نشاط المهمة، قراءة التعليمات، تسمية حفظ المسودة، أولوية التصميم وإزالة التكرار | قرارات21/25/68/72 قبل أي تغيير صلاحيات/حالات |
| الملفات والرفع | 29،30،31،32،62،64 | تعريب كامل، معنى النسخة والرؤية، تقليل التعقيد، الاستبدال واسم التنزيل العربي | الحفاظ على signed URLs والعزل والرؤية |
| النسخ والمراجعة | 35،36،37،38،39،40،41،57،60،61 | حالة النسخة، تحقق السبب والتغذية الراجعة، النص العربي، إعادة الاستخدام وسياق التعديل السابق | لا كشف مسودة أو تعليق داخلي للعميل |
| إشعارات وسياق القرار | 08،42،53 | عميل/عمل/نسخة ووجهة دقيقة، تأكيد القرار، إزالة الالتباس والطلبات القديمة والتكرار | منع القرار المكرر ليس إغلاقًا لمشكلة العرض |
| بوابة العميل | 46،48،49،50 | الفراغ والتسليم، سياق رابط محفوظ، رسالة رفض صحيحة | لا كشف وجود عمل غير مصرح |
| الجوال | 65،67 | وضوح التنقل واحتواء قائمة الإشعارات داخل الشاشة | قياسات فعلية ولمس/لوحة مفاتيح |

### منفّذ/موجود ويحتاج تحققًا — لا يعاد بناؤه من الصفر

| SIL | ما ثبت | ما بقي |
| --- | --- | --- |
| 04 | الشاشة تصرح بأن الدعوة رابط وليست بريدًا | رسالة ما بعد الإنشاء نفسها |
| 05 | مسار الدعوة موجود | قبول أحدث رابط بالبريد الصحيح وحالات الرابط؛ السبب القديم غير مثبت |
| 06 | قبول القائد المحلي R23-D بعد مراجعة3 ملفات؛ اسم العميل المصرح/fallback وربط clientId الصحيح؛ 26/26 وTypeScript وESLint ناجحة | تحقق بصري وCI ومستضاف وقبول المالك؛ مراجعة CSS مصدرية فقط |
| 09 | تصحيح Kanban واجتياز الكمبيوتر والجوال وRTL في CI الأخير | قبول الاستخدام المستضاف بالماوس/اللمس وإكمال بوابة الدفعة |
| 44 | اختيار مساحة العميل منفذ وله تجربة مستضافة موثقة | الجوال والتبويبات وسحب النطاق واختلاف الدور بين المساحات |
| 47 | معالجة محلية لأخطاء الوسائط | فيديو صالح/تالف وانتهاء الرابط ورسالة عربية على النسخة المنشورة |
| 59 | إرشادات الحقول مقبولة محليًا في R23-B؛ focused7/7 وcombined230 وTypeScript وlint ناجحة للدفعة | CI والقبول المستضاف والمالك؛ النجاح المحلي ليس قبولًا نهائيًا |
| 63 | نص العميل المشاهد مقبول محليًا في R23-B بنفس أدلة الدفعة | CI والقبول المستضاف والمالك؛ لا توسيع صلاحيات |
| 66 | كل بطاقة جديدة لوحدة عد تحجز1؛ قاعدة البيانات تمنع غير ذلك | التحقق المنشور وحسم البطاقات القديمة متعددة الوحدات دون إعادة كتابة صامتة |
| 73 | تعديل دور/نطاق العضو وتعطيله موجود محليًا | دورة الحياة المستضافة والجلسة القديمة؛ النقل وإعادة التفعيل غير منفذين |

### قرارات أو تحقيقات قبل التنفيذ

| SIL | المطلوب من المسؤول الأول |
| --- | --- |
| 03 | فصل المسمى الوظيفي الحر عن الدور الأمني المحدد؛ لا أدوار أمنية نصية حرة |
| 21 | تحديد حق مدير الحساب في إسناد المهام قبل تعديل القاعدة الحالية |
| 25 | تحديد علاقة حفظ المسودة/المهمة ببدء المخرج وSLA؛ لا بدء تلقائي صامت |
| 33،43 | هل إكمال المهام وقائمة الجودة إرشادي أم شرط مانع؟ |
| 51 | اختبار بدء SLA والزمن والتأخر؛ ليست فجوة كود مثبتة |
| 68،72 | حسم تحرير مهام الآخرين ودور المصمم؛ تحسين العرض منفصل عن تفويض الكتابة |
| 71 | تأكيد مصدر بيانات UAT الشبيهة بالشخصية؛ لا نسخ قيمها أو استبدال بيانات مستضافة بلا إذن |

### نجاح مستضاف محدود

- SIL-52: بقاء النسخة المرسلة للعميل أثناء إعداد مسودة داخلية جديدة دون كشفها.
- SIL-54: احتساب التسليم بدل الحجز مرة واحدة وثبات الرصيد بعد التنقل.
- المصدر: تجربة المالك، جولة مدار02 بتاريخ2026-09-10. لا يُستنتج قبول شامل.

### ديون السجل التاريخي — مرتبطة ولا تُضاعف العدد

| المعرف التاريخي | التصرف الحالي |
| --- | --- |
| S015-P2-098 | متبقٍ في تجربة إدخال العميل/الباقة؛ يربط01/17/18/19/66 |
| S015-P2-132،136 | الكثافة العامة والتواريخ/اتجاه النص لم تغلق بالكامل؛ تربط حزم UX الحالية |
| S015-P2-111،112،114 | حلّت محلها132/133/SIL-09؛ ليست3 أعمال جديدة |
| S015-P2-115 إلى126 | تنفيذ تاريخي موجود؛ احتفظ بالقبول المتبقي مع SIL المقابل، لا تعِد تنفيذ الكل |
| S015-P2-128،139 | مسار تنظيف/عزل واحد قابل للتراجع؛ التطبيق المستضاف والتحقق يتطلبان سلطة منفصلة |
| S015-P2-131 | تعافي Drawer الجزئي مثبت؛ أول فشل قراءة وبقية الشاشات تحتاج تحققًا |
| S015-P2-133،134 | دخول البطاقة والتبويبات منفذان؛ إعادة قبول الاستخدام الأوسع باقية |
| S015-P2-135 | العرض تحسن لكن بيانات/أرصدة قديمة تحتاج حسمًا؛ SIL-54 لا يغلقها |
| S015-P2-137،138 | تحسينات الدعوة ومراجعة الإنشاء منفذة؛ قبول متعدد العملاء/المالك باقٍ |
| S015-P2-140 | نفس مسار الوسائط SIL-47 |
| S015-P1-135،136 | تحقق نطاق الفريق ودورة العضوية؛136 يقابل SIL-73 |
| S015-P2-078،082،087،127 | تنظيف ترميز قديم، مواءمة Git/Preview، محتوى غير جاهز، وإرسال البريد: قرارات/بوابات منفصلة |
| S015-P1-133،134 | نجاح محدود للإشعار والملف النهائي؛ لا يغلق إشعارات53 أو عزل الملف المباشر |

اختبارات قبول لا تسقط: رابط ملف لعميل آخر، جلسة عضو معطّل، حواف الدعوات،
فشل/إلغاء الرفع، فقد استجابة الحفظ وإعادة المحاولة، تعافي القراءات، الفيديو
وصلاحية الرابط، بدء/تأخرSLA، وقبول المالك الصريح. الاختبارات القديمة غير المؤشرة
تُطابق بالنجاحات الحديثة قبل إعادة تنفيذها، لا تُعتبر ناجحة أو فاشلة بالتخمين.

Plan: [remaining findings](remaining-findings-plan.md). Baseline
`61da7985bcd1a00802e1846291cf769710cbccd1`. No item is accepted merely because a
worker reports completion. Keep source, automated, hosted and owner gates distinct.

| Job | Scope | Native model / agent | Ownership | State | Checks / usage |
| --- | --- | --- | --- | --- | --- |
| R23-A | Reconcile every historical and active finding | Astra / Archimedes `01a095b0-1210-7b42-8a07-12a76c952dd6` | Read-only evidence audit | Accepted, closed | All73 SIL IDs accounted for; historical aliases reconciled; usage/cost unknown |
| R23-B | SIL-59/SIL-63 accessible Saudi form help and viewer-safe copy | Astra / Schrodinger `01a095b1-4391-7550-b154-3b3a6c8a55c1` | workspace-forms.tsx, client-home.tsx, two new scoped component tests | Local accepted, closed | RED5fail/2pass → GREEN7/7; lead typecheck/lint PASS; usage/cost unknown |
| R23-B review | Spec compliance + code quality | Astra / Halley `01a095b5-436c-71e1-b74e-f63ac6318a1b` | Read-only four-file diff review | PASS, closed | No findings, no duplicate tests; usage/cost unknown |
| Lead | Integrate inventory, prioritize dependencies, review changes and CI | Astra | Canonical docs; previous directory test correction | Running | No hosted mutation or publication |

Lead combined regression after R23-B: `npm run test:component -- tests/component/client tests/component/deliverables`
passed 28 files / 230 tests, exit0. TypeScript, scoped ESLint and diff whitespace
also passed. No new CI, hosted or owner result is implied. No worker remains live.
Next dispatch priority is SIL-06 (drawer client identity), then SIL-55 (canonical
type), in disjoint source/test slices after their file-level plans are recorded.

Preflight: audit and copy tasks have disjoint writes; copy has no dependency on
inventory for its already reproduced two findings. All runtime/build/DB processes
stay with the lead; only the copy worker runs its two new component tests.
Existing next-env.d.ts, defect-register.md and owner walkthrough edits are preserved.
The owner's canonical-file preference takes precedence over a second scratch
roadmap. Native fresh-context workers are used; no external payload dispatch or
assumed zero-cost claim. No permissions or data policy is decided by the copy task.

Previous-batch gate: run34694447510 is FAILED (257 passed, 37 skips, six copies
of one directory clipping assertion). Kanban passed desktop/mobile/RTL. The lead
prepared a closed-details filter; real rerun, persistent tests and build still
remain before that batch can be considered fully verified.

### Permanent ROLE / recall protocol — documentation steward

The lead recalls this same dedicated documentation steward for each batch and
supplies reviewed results and identifiers. This is a reusable role, not a
background daemon: no polling, scheduled automation, or autonomous continuation;
await the next lead message. Re-read the current R23 queue and remaining-findings
plan on recall, preserve all existing dirty content, and append scoped updates.
Only this delegation queue is writable; no other edits, commit, push, deploy,
runtime execution, or subdelegation is authorized for this role.

Record evidence separately as **implementation / local / CI / hosted / owner**,
with source revision, run/check identifiers and outcome when supplied by the lead.
Missing identifiers remain pending lead; never invent them or promote one level
to another. Assignment is not completion. Preserve the reconciled counts until
lead evidence authorizes reclassification. Current lead-authorized counts after
R23-D: **52 unimplemented, 10 pending,
9 decision/investigation, 2 narrowly verified; total 73**.

| Role / slice | State | Agent / batch identifiers | Evidence boundary |
| --- | --- | --- | --- |
| Documentation steward | Idle, reusable; awaiting lead recall after this update | Confucius `01a095bd-de14-7b70-8e99-99a9c9584aeb` | Queue-only evidence maintenance; no background daemon; cost/usage unknown |
| R23-D / SIL-06 implementation | Completed locally; accepted by lead | Curie `01a095be-97ad-7343-99b4-a3af946fdc25`; native inherited Astra | Drawer/team workspace + focused tests only; lead diff review, 26/26, typecheck/scoped ESLint PASS; visual/CI/hosted/owner pending; cost/usage unknown |

Historical assignment snapshot — superseded by the current R23-D status above:

Lead reports R23-D plan/spec now exists and confirms the bounded ownership above.
This records the supplied assignment, not an independent plan/spec review or a
test result. Counts and all separate acceptance gates remain unchanged.

Latest lead instruction supersedes only the earlier “next dispatch” / “no worker
remains live” snapshot for current role status: SIL-06 is now assigned for
implementation, not completed; its inventory category and all counts stay unchanged.
R23-B (SIL-59/SIL-63) remains accepted **locally only**: focused 7/7, combined
28 files / 230 tests, TypeScript and scoped lint PASS, as recorded above and in
the remaining-findings plan. These checks do not cover SIL-06 or establish CI,
hosted, or owner acceptance. Latest recorded CI **34694447510 FAILED six directory
tests**; the local assertion correction is pending rerun. No new CI, hosted, or
owner result is claimed by this documentation update.

## Persistent selector review — 2026-09-08

Peirce native Astra medium, fresh read-only context, baseline6ab50e2; reviewed
other persistent UI selectors while lead owned invitation correction/CI. No
edits or tests; completed and closed. No additional confirmed blocker; identified
conditional obsolete controls in task-notification test. Lead verified source
and recorded incomplete notification E2E proof in preflight. No external route,
no retries; usage/cost unknown. Full corrected CI and owner checks remain pending.

## Production target advisory — 2026-09-08

Parfit native Astra medium, read-only, HEAD6ab50e2. Cross-file runtime/config
review justified by production auth and fixture boundary. No secrets, network,
tests, writes or deployment. Confirmed required public Supabase configuration,
NODE_ENV production fixture denial, separate production project requirement.
Lead verified cited env/parser/proxy/fixture source. No schema or behavior change;
usage/cost unknown. Production database choice and owner acceptance remain pending.

## Preview preflight — 2026-09-08

Two native Astra read-only reviewers, both finished and closed. Bacon reviewed
bounded permission/route/invitation/migration changes: no confirmed regression;
real DB concurrency, replay and rollback not proven by source review. Schrodinger
reviewed151 text files/18,518 changed text lines for public-repository privacy:
no new high-confidence disclosure; binaries/ignored files/historical lines excluded.
Lead owns shared tests, evidence, staging and deployment controls. No worker writes
or external model route; usage/cost unknown. CI and hosted readiness stay pending.

## UI4 —2026-09-08, LOCAL PASS

Harvey native gpt-6-astra medium owns3presentationfiles and directly affected
component tests. Wegener native Astra medium owns the isolated full-text visual
test and its include entry. Lead owns browser tests/docs/shared runtimes.
See [UI4 plan](ui4-plan.md). No overlapping writes, external dispatch or commits.
BaselineHEAD115fb9af, dirty source copies in temporary ui4-baseline directory.
Panel SHA256520407C4AD9BB7FFF86105E3362AD3B801830D68979FD7E1147DA9252F8725D1;
detail36FD5F31E3169DFC5657FBD077D3F1D2BF279B84A90C66C0E123B764E4E366D0;
preview7EB04752AA094A9EC6CAAA3B036D4E1F8AD740221D5BAF448038ADC3DA42E33D.
Additional visual worker is justified because route fixtures have no caption;
it verifies real shared component CSS without altering product fixtures.
Usage/cost unknown. Owner20/hosted/real-role acceptance remains pending.
Harvey reported RED14/GREEN39 and final focused49; Wegener implemented isolated
visual tests, lead ran6PASS. Rawls independently accepted exact production delta
and follow-up tests. Lead browser51PASS/9intentional profile skips; TypeScript
and scoped lint exit0. Full results and initial failures: [checkpoint](ui4-checkpoint.md).
All source writers finished; no external providers, server or protected-state changes.

## UI3 — 2026-09-08, LOCAL PASS

Turing (native gpt-6-astra medium, 01a08074-d97e-7eb3-9af5-1636c92fd3be)
owns the two production files and two component test files in [UI3 plan](ui3-plan.md).
Lead owns docs, browser tests and shared runtime. Baseline HEAD115fb9af plus
existing dirty files; exact copies retained in the local temporary baseline.
Drawer source SHA256 B2DBDB8B6C6EB1950582E65F31707E3DFE7AD417B07589A3D8B2505D4F9F4133;
forms32C4A3FA04CEB03C922F0154223F906C012EFDA948C5B4F2F54D55EF3DF63CC1;
drawer test9F64B1A7EFF1E97B18A27DC941F787BB73AF6E021429A0384D4894B57E0C5426.
No staged changes at dispatch. Native route used; no external provider retry.
Model chosen for existing form/test integration judgment. Cost/usage unknown.
Turing reported component RED6/GREEN25 and expanded55; lead full303PASS.
Lead browser RED4rows/144px, then combined12PASS; TypeScript/lint exit0.
Herschel native Astra medium independently reviewed exact delta, spec/quality
accepted without P1/P2 findings. Lead inspected375/1440 screenshots.
No correction round to production was needed. One lead browser-locator fix
resolved two matching version labels without changing product behavior.
Both workers completed. [Final checkpoint](ui3-checkpoint.md); owner/hosted open.

## UI1 browser recovery / UI2 browser coverage — 2026-09-08

Maxwell, native gpt-6-astra medium, independently reviewed the lead's bounded
sidebar-focus fix (accepted source-only), then added only the previously absent
tests/e2e/management/dashboard-presentation.spec.ts. Lead owns all runtime and
canonical docs; worker ran no processes and changed no production source.
UI1 RED brand top=-2px; isolated GREEN4, integrated GREEN28 with20 intentional
profile skips. UI2 focused25 PASS, full component286 PASS, dashboard browser6 PASS.
Lead corrected one test-only scope error: exclude the Next route announcer by
checking main-content alerts. Actual trace proved the cause; product checks retained.
Final TypeScript/scoped lint exit0;375/1440 screenshots reviewed. Worker closed.
No external dispatch, commit/push/deploy, owner pass or known cost. Current
[recovery checkpoint](ui2-recovery-checkpoint.md) supersedes historical blocks below.

## UI2 implemented — verification pending, 2026-09-08

Owner requested dashboard implementation now and restart afterwards. [Plan](ui2-plan.md).
Heisenberg native Astra medium owns dashboard/test/report; lead owns PortfolioPage
read completeness and its new test, plus documentation. Existing props preserved;
disjoint source ownership, focused test runtime serialized. Exact three-file
pre-UI2 baseline saved against dirty HEAD115fb9af; no clean-HEAD substitution.
Planck accepted both production slices by independent source review. See
[lead checkpoint](ui2-lead-checkpoint.md) for actual test evidence. No external relay/retry,
commit/push/deploy or further Next run. Cost unknown. Browser and owner gates pending.

## UI1 implemented / integrated gate blocked — 2026-09-08

Continuation: Laplace readonly historical-harness review completed; Planck readonly
UI2 scope review completed. Lead fresh-cache experiment78988 exited1 at root
warmup before tests; no source changes. No proven cache cause. See
[diagnostic and next boundary](ui1-runtime-diagnostic.md). Historical UI2 execution
gate was overridden by the owner's later before-restart request above; browser
acceptance remains pending.

Owner approved designs and implementation. Canonical [UI1 plan](ui1-plan.md).
Baseline HEAD115fb9af; 1010 tracked/untracked file hashes captured before writers.
One native Astra medium implementer Heisenberg (01a07fe8-3d3d-78b1-a78a-394af0f47efa)
completed globals.css and two shell components after isolated RED/GREEN.
Readonly Astra medium Laplace (01a07fe8-39cb-7683-a14e-d5482a44f638) completed
coverage/risk inventory: fixture management nav absent, viewer shell label not
real-role coverage; focus contrast and clipping require lead checks.
Lead owns new browser spec, runtime and documentation. No external relay retry.
Usage/cost unknown. No commit, push, deployment or owner UAT pass.

Independent Astra reviewer Planck (01a08000-5dd1-7c63-8a2a-494d728d19c2)
accepted bounded source scope; focus-test finding corrected and rereviewed.
Lead verified 263 component tests, 4 isolated visual tests, tsc and scoped lint.
Full Next browser runs did not reach tests. Resume there before UI2; see
[checkpoint](ui1-lead-checkpoint.md). Owner20 and owner walkthrough stay pending.

## Research-only checkpoint — 2026-09-08

X010-B-7C-20 ready for owner design review; no production successor authorized.
Two native Astra workers handled public-reference research and copy/prototype
review. Lead integrated their results into [the package](ui-research-20260908/README.md).
External Gemini relay launch was denied twice before generation; no retry or
workaround used. Partial approval did not cover the broader operational brief.
No Flash completion or zero-cost claim; actual token/cost total unavailable.
Next gate: owner approval of screens, then scoped implementation planning.

## X010-B-7C-22 continuation — 2026-09-12

The September 10 Kanban/member/count-unit correction batch is now identified
as X010-B-7C-22; historical D17/D18 identifiers below are unchanged. One native
Astra read-only worker verified the collision; the lead applied the correction.
Earlier source review and local build/JS tests passed as recorded in tasks.md.
Runtime gates remain pending. Docker startup currently stops at update recovery;
the local Playwright warm-up aborted before scenarios executed. Use the already
approved disposable GitHub CI route after reviewing/staging this batch only.
The branch's automatic Vercel deployment remains disabled. Owner checks stay open.
The lead has since pushed the reviewed batch through the authorized CI route;
follow [the exact-source checkpoint](x010-b-7c-22-ci-checkpoint.md) for runtime
results rather than treating this historical pending state as the latest result.

## Historical D18 checkpoint — LOCAL PASS at that checkpoint

D17 / X010-B-7C-18 and D18 / X010-B-7C-19 are LOCAL PASS. Lead six-file
regression session 31896 exited 0: 59 PASS / 25 intentional profile SKIP (5.5m),
including all six D18 cases passing again after the 6 PASS diagnostic (4.4m).
Independent audit and viewed screenshots support acceptance. Lead accepts the
installed Turbopack plus /work warmup for the shared local fixture harness;
no dependency, guard or assertion changes and no proven root-cause claim.
Fresh node check, scoped ESLint and diff check exited 0 (lead-reported).
At that historical checkpoint no local successor was approved. Exact-HEAD CI/target confirmation and owner
walkthrough remain pending; all 20 owner checkboxes remain unchecked.
Lead owns runtime and final results; no further worker implementation is
requested. See [diagnostic evidence](d18-report.md#current-shared-harness-checkpoint--2026-09-07).

## Historical D17/D18 checkpoint — before warmup diagnostic

Both layouts implemented after observed RED; independent spec/quality reviews
found no issues. Lead full component 38 files / 263 tests PASS. First shared
browser: exit 1, 11 PASS / 5 FAIL / 5 intentional SKIP (6.9m). All four D17
geometry cases, six pending-inbox regressions and D18 desktop1440 passed.
Five other D18 cases failed initial drawer opening before geometry. Reviewed
test-only bounded React readiness correction retains one click and unchanged
geometry; no real prehydration click support is claimed.
Corrected six-case D18 rerun: exit 1, 4 PASS / 2 FAIL (9.4m).
Mobile and RTL profiles at 1440/375 passed. Desktop1440 passed geometry,
interactions and DOM stress, but failed the final console assertion:
Next Router action dispatched before initialization. Desktop375 failed the
30s React readiness poll before geometry; its cause remains unproven.
D18 remains implemented, verification-pending and unchecked. Standalone
six-file scoped ESLint and git diff check exited 0. Typecheck PASS, exit 0.
Final isolated build PASS, exit 0: compiled in 2.5min, TypeScript 20.5s,
11 static pages. D17 / X010-B-7C-18 is LOCAL PASS and checked; D18 /
X010-B-7C-19 remains unchecked, implemented and verification-pending.
Wave-owned verification processes have ended. Final normal git diff check
passed; source changes remain local and unstaged.
All 20 owner checkboxes remain unchecked (lead verified).
Next bounded diagnostic: distinguish Next dev cold-start/HMR effects from
product behavior. The completed build is not production-mode browser
verification. `src/server/navigation/route-fixture-env.ts` disables `as=` actor
fixtures under `NODE_ENV=production`; do not bypass that guard. Subsequent
production-mode browser verification requires an approved authenticated DB
setup and has not been executed. External gates remain pending.
No next fix, dependency upgrade or error filtering is implemented/approved.
D17 desktop/mobile and D18 desktop images saved in visual-20260907.
All 20 owner items remain unchecked; real-DB/hosted/CI/deployment acceptance
remains pending. Lead owns final integration and the next checkpoint update.

## Historical dispatch/provider chronology — superseded by checkpoint above

Owner subsequently approved both slices. Current state: D17/D18 test-only
preparation dispatched to reused Fermat/Hubble, respectively. Detailed scope
and exact production hashes are in d17-d18-brief.md. Lead owns integration,
docs, browser RED/GREEN and shared gates; no production layout edits before
observed RED. Existing source snapshots retained in local temporary storage.
No new test PASS or readiness claim at dispatch. Native Astra reuse preserves
the existing component/capability audit context; Flash will receive a bounded
generic layout implementation request after actual failing measurements.

Lead browser RED completed: desktop1440 two failures, approve button136px
versus max56 and collapsed task row152px versus max120. Both production
hashes still matched the brief; screenshots inspected and retained. Other
steps reached completion. Focused worker components5/5 and6/6 are preservation
coverage, not geometry RED. Cross-review requested positive task date/status
assertions and explicit browser long-text coverage.

Fresh Flash3.8-low run 11:24:22–11:24:34 UTC completed exit0, generic layout
recipe only; separate scratch still empty. No source payload, usage unknown.
Lead accepted sm:items-start for the decision grid, rejected redundant shared
button styling and the unverified claim that border-t/pt-2 would save32px.
Task implementation must meet actual geometry without fixed/clipped heights.
Both native workers released for disjoint production edits after RED.
Long-text browser stress may replace rendered text only after normal fixture
checks; this proves layout, not persistence or source-to-view data mapping.

Reused native Astra workers Fermat and Hubble completed independent read-only
audits of client decision-panel density and collapsed execution-task rows.
No implementation or shared tests were dispatched in this continuation.

The owner reconfirmed the intended Google account. Initial restricted
`agy models` returned a sign-in error. After interactive initialization and
approved execution outside that boundary, the CLI displayed the intended
identity with Google AI Pro and Use AI Credits off; model listing succeeded.
The exact cause of the initial error (execution boundary versus session
initialization) is not established. Do not request another account switch
solely from historical mismatch notes. Private identity/logs stay outside
project evidence; global skill account notes were not edited here.

Gemini advisory: agy 1.1.27, gemini-3.8-flash-low, read-only relay, generic
self-contained UI brief only, separate empty temporary working directory.
Run 2026-09-07 10:52:46–10:53:02 UTC completed with exit 0 and five Arabic
review bullets. Independent post-run directory listing was empty. Relay
touchedFiles/readOnlyViolation were null (not proof of a clean Git diff).
Usage/cost was not reported; do not call it zero or infer unlimited quota.
No project source or customer data was included in the planned brief.
During earlier interactive setup, a malformed slash command was accidentally
submitted and interrupted after the assistant read its scratch session log.
That was not a successful review; its usage is unknown. Both interactive
sessions were closed. Credit overages were not enabled.

Original proposed slices (historical; now implemented as recorded above):

- D17 / candidate X010-B-7C-18: client-approval-panel.tsx only. Prevent the
  short approve form/button stretching alongside the reason textarea; keep
  44–56px buttons, visible required reason, mobile order and all version,
  revision, idempotency and actor restrictions. Flash flagged excess blank
  space with bottom alignment; compare top alignment during browser RED
  before selecting geometry. Do not impose a textarea cap that clips content.
- D18 / candidate X010-B-7C-19: TaskWorkspaceCard within the universal drawer.
  Remove redundant nested decorative border/padding, retain outer grouping,
  native >=44px summary and natural long-text wrapping. Preserve the full
  editor, validation focus, failed-save values and capability checks. Flash
  reinforced focus-outline and expanded-editor separation checks; no blanket
  decorative-background contrast threshold is adopted from that advisory.

Approval required for these bounded designs before TDD implementation.
Browser measurements and new regression tests remain unexecuted. Prior
D15/D16 local results are unchanged, not rerun. Real DB, exact-HEAD CI,
hosted/Preview and all 20 owner acceptance gates remain pending.

## Historical D15/D16 execution

Current status: X010-B-7C-16/17 locally complete; external/owner gates pending.
The chronological execution trail follows. Owner approved D15/D16; reused
native gpt-6-astra Fermat owns ProductShell/ClientShell, product-shell component
test and new mobile-shell-density E2E. Hubble owns InternalTeamDirectory only,
member component test, new team-directory-density E2E and fixture-only branch
of /members (runtime/auth/persistent logic unchanged). No ownership overlap.
Both first prepare tests, then pause for lead browser RED; only after that
may layout implementation start. Lead owns docs and all shared browser/build
processes. No external provider payload or additional agents; costs unknown.
HEAD unchanged; 103 inherited dirty entries, no staged diff. Source hashes
match D15/D16 audit below. visual-qa baseline SHA256:
F311AC700DE01AB3DC6878DA13CCFD495CDFA34A9F884B8916624C966D44CA75.

Stage 1 workers returned test-only/harness changes; production layout hashes
remain baseline. Focused shell component 10/10 and member component 6/6 PASS
(preservation coverage, not layout RED). First lead browser attempt failed
before tests: warm-up board route HTTP404. Concurrent read-only typecheck
found malformed .next/dev/types/routes.d.ts and validator.ts with duplicated
trailing fragments. No layout failure is claimed from that attempt. After
confirming ports stopped and validating the exact non-reparse workspace path,
lead removed only generated .next/dev and retried. Source/config untouched;
root cause of generated-output corruption remains unproven.

Fresh bounded browser RED then executed: 2 tests failed for intended geometry,
exit 1. Assigned-work 375px sticky header measured 115px >112px. Directory at
1440px had 126/126/220px normal rows >120px and paired rows at the same Y with
578px X difference (two-column cards). Both layouts still had baseline hashes.
Stage 2 now released to workers. Read-only cross-review confirmed fixture
guard ordering and requested long-text visibility plus denied-actor coverage.
Management navigation is absent in the existing route fixture; component
role-link checks cover its preservation, not live-browser navigation proof.

Stage 2 implementations returned and lead inspected both layouts and the
guarded route. Independent read-only cross-review found no actionable D15
issue. Lead full component: 37 files/253 tests PASS; scoped eight-file ESLint
and diff check PASS. Navigation/fixture unit gates: 2 files/9 tests PASS.
Combined browser GREEN is running; four client-mobile focus-visibility failures
were observed and diagnosis is pending. No final browser/build claim yet.
Directory desktop and 375px captures inspected and saved. Initial desktop
trail capture produced a caret-color hydration warning; the new screenshot
calls use Playwright default caret hiding. Worker traced this to installed
Playwright; a test-only caret-initial correction awaits the run's end.

Combined run finished exit 1: 39 passed, 20 intentional skips, 4 client-mobile
focus-reveal failures, 9.9m. Directory 12/12 and existing visual-qa 15/15 PASS.
Fresh typecheck PASS. Test-only diagnostic retry added 2s polling with exactly
the same containment/focus expectation and caret-initial screenshots: 4/4
still failed, proving persistent clipping rather than immediate sampling.
Lead inspected the failure image: focused Files link is partially offscreen.
Fermat now owns a minimal client-link focus-reveal correction and component
regression; no test forced scrolling, viewport state or route change allowed.

Final D15 correction: client navigation onFocus reveals the actual link using
scrollIntoView nearest block/inline. Component RED 1 failed/10 passed, GREEN
11/11. Hubble read-only review found no actionable issue. Lead final full
component 37/254 and final eight-file scoped lint PASS. Final shell plus
client-inbox browser: 19 passed, 20 intentional skips, exit 0 (7.8m), including
all four previously failing cases. No caret hydration warning observed in
that run. Lead inspected/saved both mobile shell captures and earlier directory
captures. Final typecheck/build PASS, exit 0 (115s compile, 20.5s TypeScript,
11 generated pages). Final diff check PASS. X010-B-7C-16/17 locally complete;
all real-DB/hosted/exact-HEAD CI/20 owner gates remain pending. No commit,
push, deployment or new dependency/ADR. No additional agents needed.

Historical pre-approval audit after D13/D14: D15 Fermat and D16 Hubble (reused native
gpt-6-astra) perform read-only bounded design audits. D15 owns analysis of
ProductShell/ClientShell mobile header density; D16 compares MemberList and
InvitationList for the next compact-list slice. No implementation, tests,
shared builds or writes are authorized to either worker in this wave. Lead
corrects stale handoff text and will present the selected design for approval.
No additional provider/agent or external source payload. Usage/cost unknown.
Baseline HEAD 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21; 103 dirty status entries,
no staged diff. Relevant SHA256 before audit:
ProductShell 499FD8FF8B1DC7103BC1670B320196899714448C3438C1530882743D558B8B40;
ClientShell 722B03CCC319E2517865F98565D10BEE528154C2A6815DE355D5BEBD841195E9;
MemberList D3662D1A269BB64E6B3011BAF0AC8BCF28313D58EDC5C20E9377FB01CF6A462E;
InvitationList AB4D076F617A85B3238323E1F8F4A4BE839C1AD02B88CA61C37109EAFCFCD8A7.

D16 returned a read-only recommendation for InternalTeamDirectory, not legacy
MemberList. Lead confirmed /members uses MemberList under fixtures but
InternalTeamDirectory for persistent data; existing member component test has
only one member/role/client. A future density change therefore needs browser
coverage rendering the real directory, not just the legacy fixture controls.
Recommended scope preserves all names, translated roles, client scope, status,
count/order and empty/admin states; no invented row actions. Invitations are
deferred because their mutation/feedback paths need separate acceptance.

D15 returned read-only: mobile client shell stacks brand/navigation, an
account card and a separate notification header. Proposed regrouping moves
the existing account/sign-out into the utility header and reduces mobile
spacing. Management keeps every breadcrumb in a locally scrollable mobile
row, with keyboard visibility, and retains desktop wrapping. Proposed normal
mobile shell ≤200px and utility ≤112px are acceptance targets, not measured
results. Lead inspected both shell implementations; all four baseline source
hashes remain unchanged. D15/D16 audits complete; design approval required
before implementation. No code/test/build execution claimed for these audits.

Delegated wave (owner requested majority delegation): D13 Fermat / native
gpt-6-astra owns TeamWorkspace, drawer trigger extension and their component/
visual tests (X010-B-7C-14). D14 Hubble / native gpt-6-astra owns only
WorkspaceInlineMedia and its new component test (X010-B-7C-15). No overlapping
write sets; each may run only its focused component tests. Lead owns canonical
docs, independent review and shared browser/build verification. Both completed
implementation and cross-reviewed the other worker read-only. Fermat then
received sole ownership of the media test to add the requested A→B→A race
regression. External-provider state unchanged, usage/cost unknown. Baseline
HEAD remains 115fb9af5a43b7cbd2a8855c568f89bb86f9fa21 with inherited dirty edits.
TeamWorkspace SHA256: 749F441AA22998C74975815CEBBDD1787175A17E4D87CCECF6D9B32291178EFD.
Drawer SHA256: 33AAE09BB19D22A5FE91326AD4DB72D8AE30C0C47FA2A103040B5C171C453D11.
Workspace files SHA256: BBBC51A2DCA57F13AA54EFC57578424A4024A0432D7E1CD9D8391832C318DB85.

D13 RED 3 failed/17 passed; GREEN 20 passed. D14 RED 6 failed/6 passed
and 3 unhandled rejections; GREEN 12 passed, expanded review follow-up 13.
Lead full component run 37 files/248 tests PASS (46.80s). Full fixture visual
15/15 PASS (4.9m, exit 0), covering off-button row hit area, Enter/Space,
focus return, mobile filter height ≤190px and 44px controls. Desktop/mobile
screenshots inspected and saved as visual-20260907/*d13.png.
Initial typecheck caught unsupported `exact` in a Testing Library role query;
Fermat corrected the test only; fresh lead typecheck PASS. Final lint/build
status is recorded in gate-status.md. No production changes after browser QA.
Media tests mock the signed-preview action and simulate load events; real
URL expiry/decoding and hosted authorization are not established by them.
No additional agents, new dependency, ADR, hosted write, commit or deployment.

Current wave: owner approved the bounded compact My Work design. D10 (Fermat,
gpt-6-astra) owns `team-workspace.tsx`, optional `team-work-row.tsx` and
`team-workspace.test.tsx`; D11 (Hubble, gpt-6-astra) owns only
`tests/e2e/visual-qa.spec.ts`. Lead owns documentation, integration review and
shared browser/build processes. D10 alone may run its focused component test
for RED/GREEN; D11 does not run shared tests. No external source dispatch.
Baseline HEAD: `115fb9af5a43b7cbd2a8855c568f89bb86f9fa21`, inherited dirty
changes preserved. SHA256 before dispatch: TeamWorkspace
`E4E09B06E014ED0269888C43A2E40A2D3BA643ED1F0107E0DFC8C1FF41DEA7C0`;
visual-qa `3D9F8E893D5709AA64A1C5B3EDACAB81B6FA112FDA237CDB4DEE7A0746996601`.
Both writers completed. D12 Hubble read-only review confirmed unchanged
scope/authorization/Kanban and flagged inherited image-load failure handling
(S015-P2-140), not a new authorization regression. Lead removed D10's
unrequested Arabic-only contentStage transform after a new failing regression;
human mixed-language labels now remain intact. Usage/cost for these native
jobs was not reported and is unknown.

D10 worker RED: 3 fail/3 pass, expanded 4 fail/6 pass; GREEN 10/10.
Lead initial combined component 3 files/21 PASS; stage-preservation regression
RED 1 fail/10 pass then GREEN 11/11. Final full component 36 files/232 PASS
(32.52s). Typecheck/scoped lint passed before D11's test-only locator correction.
D11 initially used exact getByLabel for a wrapping select label and timed out;
lead inspected the error snapshot, switched to getByRole(combobox), and reran
the full fixture suite: 15/15 PASS, exit 0 (3.9m). First attempt stopped after
1 failed/3 passed to avoid repeating the same locator failure on other devices.
Final scoped ESLint/diff checks and production build PASS, exit 0. Build
compiled in 77s, TypeScript finished in 34.9s and generated all 11 pages.
No generated-output cleanup was needed in this batch. Lead accepted D10/D11
locally after actual diff review and desktop/mobile screenshot inspection.
No commit, push, deployment, DB mutation or owner acceptance was performed.

Final post-date-sweep local verification: full unit 74 files / 400 tests PASS
(59.61s); full component retry 36 files / 222 tests PASS (71.71s). The first
full component run had 221 pass / 1 fail: an existing Kanban test still expected
raw ISO. Lead changed only its displayed-date expectation to literal Arabic;
input values and production behavior were unchanged. Fresh production build
then passed compilation, TypeScript and page generation, exit 0.

The first build attempt failed on a malformed stale `.next/dev/types/validator.ts`
line 251 (`clients/page.tsx` outside a comment). Lead inspected it, then removed
only the verified workspace generated dev-types directory. The successful
retry used the same localhost public placeholders and APP_ENV=local. This is
the second observed stale-output corruption; root cause remains unproven.
No source/compiler check was disabled and no Docker reset was attempted.

Latest browser follow-up after D07-D09: full fixture visual-qa 15/15 PASS,
exit 0 (4.1m), fresh final report passed. Added raw-ISO list-display assertions;
scoped test lint passed. This supersedes the earlier pre-D07-D09 browser
limitation below, not real-data or owner gates. Details: visual-check-20260907.md.

Single objective: complete the remaining Spec 015 corrections and verification,
with Astra owning scope, integration, and acceptance. Human acceptance remains
deferred; no readiness claim follows from a worker report.

| Job | Scope / ownership | Model and mode | State / evidence |
| --- | --- | --- | --- |
| D01 | Read-only canonical remaining-work inventory | gpt-6-astra, medium | Returned; confirmed 9A-D implemented, 9E pending; identified residual density/date/profile work |
| D02 | Sanitized project-delegate skill review | gpt-5.3-codex-spark, CLI read-only | Completed; selected ownership/manifest clarifications accepted; reported 49,312 tokens, unsuitable overhead for repeating tiny jobs unchanged |
| D03 | Isolated rollover source review, two files only | zai-coding-plan/glm-4.7, read-only | Automatic review requested explicit external-code payload approval; dispatch not started |
| D04 | X010-B-7C-10 client/file date localization | Astra worker, bounded write set | Locally accepted after lead diff review; unit 2 files / 19 tests, component 3 files / 26 tests, typecheck passed; Preview/owner pending |
| D05 | X010-B-7C-11 real CLI recovery tests and correction | gpt-6-astra, reused Hubble | Locally accepted; focused unit 41/41, full unit 74/400, focused lint, typecheck and syntax passed; real-DB/hosted pending |
| D06 | X010-B-7C-12 drawer task validation/save feedback | gpt-6-astra, reused Fermat | Lead RED 11 failing tests + 3 unhandled rejections; GREEN 21/21 including existing capabilities; lead corrected React refs lint issue; focused lint/typecheck passed |
| D07 | Residual S015-P2-136 shared card date/channel/format | gpt-6-astra, reused Fermat | Locally accepted: lead diff review, component 14/14, scoped lint, typecheck and diff check PASS; post-change browser/owner pending |
| D08 | Approval-panel ISO/human due label consistency | gpt-6-astra, reused Fermat | Locally accepted; worker RED 7 fail/4 pass then GREEN 28/28; lead combined 7 files/75 tests, scoped lint/typecheck/diff review PASS |
| D09 | Client and management work-list visible dates | gpt-6-astra, reused Hubble | Locally accepted; worker RED 13 fail/6 pass then GREEN 19/19; lead combined 75/75, scoped lint/typecheck/diff review PASS; ISO input values preserved |

D07 scope additionally includes the same card's channel/format footer, which
joined raw tokens despite localized badges. Existing domain-label helpers are
the only permitted presentation change. Next confirmed date-sweep candidate:
`persistent-client-approval.ts` supplies raw `client_due_date` as dueDateLabel,
and `client-approval-panel.tsx` rendered it directly. D08 now reuses the same
shared ISO-or-human-label policy as client detail. D09 also removes display-only
raw ISO slicing from client and management lists. No schema or approval-authority
change was needed. Post-change browser/owner verification remains open.

Lead integration for D07-D09: seven component files / 75 tests passed, exit 0
(16.29s), including existing panel permissions and client-list scenarios.
One existing management-list assertion failed because it expected raw ISO;
lead updated only that display expectation to literal Arabic after observing
the failure. Original input fixture values stay ISO. Scoped ESLint and full
typecheck passed. Workers owned disjoint production/test files; only Fermat
could edit the shared localization module. No shared test/build/DB workers
were left running. The previous 15/15 fixture visual pass predates D07-D09.

D07 worker evidence: date RED 7 failed / 1 passed, then GREEN 8/8; footer
RED 5 failed / 9 passed, then GREEN 14/14. Lead independently reran
`test:component -- tests/component/deliverables/deliverable-content-card-date.test.tsx
--maxWorkers=1`: 14 passed, exit 0 (2.42s). Tests use real components/models and
literal Arabic expectations, cover source precedence/Riyadh rollover/fallbacks
and localized or unknown footer tokens. Scope is exactly the shared card and
its new test; formatter and domain-label helpers are unchanged. The earlier
15/15 visual run predates D07 and is not post-change browser evidence.

Historical: Google Flash route was pending account correction (superseded by
the verified continuation above). Z.ai subscription account was
user-confirmed; payload-specific approval remains pending. Spark is available
via CLI but absent from native spawn metadata. No prices inferred; cost unknown.

Write ownership for D04: client-deliverable-detail.tsx, file-groups.ts,
file-groups.test.ts, and one new dedicated client-detail display test only.
Workers do not run shared builds, databases, or broad tests concurrently.
The coordinator runs integration checks and records actual results here.

Latest local Docker readiness probe: approved read-only `docker version
--format {{.Server.Version}}` was bounded to 8 seconds and returned ETIMEDOUT,
no output. Real-DB checks remain unavailable; no settings/reset/container
mutation was attempted. This is distinct from the resolved Playwright Windows
cleanup permission issue documented in `visual-check-20260907.md`.

## Verification for D04

- Focused unit: `test:unit` file-groups + arabic-display — 19/19, exit 0.
- Focused component: client-deliverable-dates + client-files-board +
  client-pending-inbox — 26/26, exit 0 (103.57 seconds).
- `npm run typecheck` — exit 0.
- Focused ESLint on the four source/test files produced no result during the
  bounded wait and was interrupted by the lead (exit 1); lint remains pending,
  not passed. No lint diagnostics were returned. Retry before integration.
- Fresh retry of the same focused ESLint command on 2026-09-07 completed
  successfully (exit 0), closing the previous pending local lint check.
- `git diff --check` — exit 0; existing CRLF conversion warnings only.
- A diagnostic run overriding `core.autocrlf=false` reported CRLF as trailing
  whitespace in existing unrelated files; no repository setting was changed.
  The normal configured check and scoped changed-file check both passed.
- Global skill quick validator — `Skill is valid!`, exit 0.
- No failing-before-fix run was captured for this slice; no red/green claim.
- No fresh full suite, build, hosted/Preview, or human acceptance run.
- No commit, push, deploy, invitations, or Production changes.

## Rollover review follow-up — local correction under verification

Lead source inspection found failure-handling concerns in
`scripts/prepare-s015-clean-workspace.mjs`:

- `runRollback` disables target memberships before restoring the bound source.
  If the restore request fails, it throws after disabling the working target,
  without restoring that target. This needs a direct CLI failure-injection test
  and a reviewed recovery strategy before hosted rehearsal.
- `compensateFailedApply` does not inspect either database response for errors;
  recovery therefore cannot be assumed successful from an attempted request.
- The binding-present/sources-active replay calls `applyWorkspace` outside the
  compensation catch used on a first apply. Reproduce the replay failure path
  before choosing a correction.

These observations do not invalidate recorded happy-path local test results,
but those results do not establish recovery under database request failure.
The existing 9E exact-HEAD CI and explicit hosted-target approval gates remain.
Next safe task: direct failure-injection coverage and bounded rollover recovery
fix, with no hosted mutation and no alteration of permissions/audit contracts.

### Local correction evidence

The worker corrected the three concerns above in the production CLI. Rollback
restores/verifies bound sources before disabling the exact run target set.
If a request fails, it attempts to restore the previous verified target before
undoing source restoration. First apply and binding-present reapply now share
checked compensation; incomplete recovery raises an explicit error rather than
claiming successful rollback. Unrelated target memberships are not disabled.

Lead ran `test:unit` for clean-workspace-cli-recovery and clean-workspace with
`--maxWorkers=1`: 2 files / 41 tests passed, exit 0. New tests execute the actual
CLI orchestration with in-memory SDK/OS boundaries; they do not establish real
PostgreSQL or hosted behavior. They cover request failure before/after commit,
lost responses, replay, audit retry, source/target isolation and safety gates.

Residual: multi-request recovery has a temporary dual-active window and no
crash/concurrency/atomicity guarantee. `RECOVERY_INCOMPLETE:APPLY` or
`RECOVERY_INCOMPLETE:ROLLBACK` is an operator stop condition: preserve evidence,
inspect the authorized target state, and obtain an explicit recovery decision.
Do not reset the database, delete history, or blindly rerun apply/rollback.
Hosted rehearsal and the original owner-acceptance gates remain pending.

The direct CLI test also exposed an earlier startup defect: the password map
passed strings rather than key/value pairs to `Object.fromEntries`, throwing
before source discovery. This was corrected before the worker's recovery RED
run. Worker-reported RED then showed five actual recovery failures: two
source-restore failure variants disabled the previous target; compensation
cleanup/restore failures hid incomplete recovery; binding-present reapply
left the target active after a profile failure. Worker pre-edit script SHA256:
`1E0C3CED978184C66D0BD5E2D4C2CC525A69A156A4FCD8BE980FF36EEBCE084A`.
Snapshot diff was captured in the worker session, not persisted as a file.

### Task form correction evidence

Lead RED command ran the unchanged production TaskForm against 11 new tests:
all 11 failed with 3 unhandled save rejections. The worker then added Arabic
field feedback and focus, nullable optional-control normalization, preserved
inputs on denied/thrown saves, and stable retry keys for unchanged payloads.
The lead corrected a `react-hooks/refs` lint finding by constructing the RHF
submit handler inside the submit event, without suppressing the rule.
Fresh focused component runs passed 21/21 including the existing capability
tests. Focused ESLint and TypeScript passed after the correction.
Retry identity survives only while the form is mounted; no persistent draft
storage or reload-safe retry claim is made. Browser/visual/hosted and owner
acceptance are not established by component tests.

Combined full unit run after both slices: 74 files / 400 tests passed, exit 0
(32.55 seconds). Full component run: 33 files / 178 tests passed, exit 0
(86.13 seconds). Typecheck and focused lint passed; node syntax check and
configured diff check passed. All 20 owner checklist items were re-counted
as unchecked. No new real-DB, browser, build, CI, or hosted result is claimed.

Subsequent browser evidence is recorded separately in
`visual-check-20260907.md`: 12 cases reported passing, runner shutdown hung
and was interrupted; density remains open. No active worker or test session
from that visual run remains. Compact-row design approval and local Docker
readiness remain unresolved; neither is silently counted as completed.

### Additional local verification — 2026-09-07

Lead ran `npm run test:integration -- --maxWorkers=1`: 28 files / 112 tests
passed, exit 0 (17.74 seconds). `npm run test:rls:simulator -- --maxWorkers=1`:
8 files / 24 tests passed, exit 0 (2.76 seconds). Simulator results are not
evidence that PostgreSQL RLS or hosted tenant isolation was exercised.

A local-placeholder `npm run build` was invoked, but its terminal outcome
was not retained across context recovery. No BUILD_ID was found in `.next`
or `.next-persistent` at recovery. Build verification remains UNVERIFIED;
do not infer success from the other checks or blindly duplicate the process.

Build follow-up: a scoped process check confirmed no live Next build before
retry. That observed retry compiled but exited 1 on the stale generated
`.next/dev/types/validator.ts:203` (`typ __IsExpected<typeof handler>`).
The malformed generated block was inspected; `tsconfig.json` includes dev
types. Only the verified workspace `.next/dev/types` output directory was
removed, with no source/config edits. A fresh identical `npm run build`
then passed compilation, TypeScript, page generation and optimization, exit 0.
Public Supabase settings were explicitly localhost/placeholders; APP_ENV was
local. This supersedes UNVERIFIED for the local production build only. It does
not prove live database behavior, CI, hosted deployment or owner acceptance.
The cause of the earlier generated-file corruption is not established.
