# Task Spec: SIL-50

## Goal
Fix SIL-50: "Unsent-work denial suggests selecting workspace even when already selected | Open; must not reveal hidden resource existence"

## Details
In src/ui/shared/access-states.tsx, the ResourceNotFoundState component currently has this body:
"لا يمكن فتح هذه الصفحة من حسابك الحالي. اختر المساحة المسندة لك أو تواصل مع مدير الحساب."

This text is confusing when a user is already within a workspace and tries to access an unsent deliverable. It implies they are in the wrong workspace rather than the resource simply not existing or not being available to them.
To prevent revealing hidden resource existence, the copy should be updated to something generic that doesn't mention workspaces, such as:
"لا يمكن فتح هذه الصفحة من حسابك الحالي. قد يكون الرابط غير صحيح أو ليس لديك صلاحية للوصول."
(Cannot open this page from your current account. The link might be incorrect or you do not have permission to access it.)

## Tasks for the Implementer
1. Update ody of ResourceNotFoundState in src/ui/shared/access-states.tsx.
2. Update any failing tests in 	ests/component/navigation/denial-states.test.tsx or similar that expect the old text.
3. Do not change routing or logic, only the text.
