# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: property.e2e.spec.mjs >> owner save flow, ops updates, and privileged workspaces render for the mapped owner role
- Location: tests\property.e2e.spec.mjs:441:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.goto: Test timeout of 120000ms exceeded.
Call log:
  - navigating to "http://127.0.0.1:3214/admin", waiting until "load"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - status "Loading page" [ref=e3]:
    - generic [ref=e6]: Loading
  - alert [ref=e40]
```

# Test source

```ts
  424 | 
  425 |   const approvedListing = await waitForValue(
  426 |     "approved listing record",
  427 |     () => findListingByTitle(listingTitle),
  428 |     (value) => Boolean(value) && value.status === "approved"
  429 |   );
  430 |   sharedState.approvedListingSlug = approvedListing.slug;
  431 |   expect(approvedListing.visibility).toBe("public");
  432 | 
  433 |   const approvalNotifications = await waitForValue(
  434 |     "listing approval notifications",
  435 |     () => findNotifications(approvedListing.id),
  436 |     (records) => records.some((record) => record.templateKey === "listing_approved")
  437 |   );
  438 |   expect(approvalNotifications.some((record) => record.templateKey === "listing_approved")).toBeTruthy();
  439 | });
  440 | 
  441 | test("owner save flow, ops updates, and privileged workspaces render for the mapped owner role", async ({
  442 |   page,
  443 | }) => {
  444 |   test.skip(
  445 |     !sharedState.guestEmail ||
  446 |       !sharedState.guestName ||
  447 |       !sharedState.viewingName ||
  448 |       !sharedState.listingTitle ||
  449 |       !sharedState.submittedListingSlug
  450 |   );
  451 | 
  452 |   await signInAsOwner(
  453 |     page,
  454 |     `/property/${sharedState.approvedListingSlug || sharedState.submittedListingSlug}`
  455 |   );
  456 |   await expect(
  457 |     page.getByRole("heading", { name: new RegExp(sharedState.listingTitle, "i") })
  458 |   ).toBeVisible();
  459 | 
  460 |   await page.getByRole("button", { name: /Save property/i }).click();
  461 |   await expect(page.getByText(/Property saved to your HenryCo account history/i)).toBeVisible();
  462 | 
  463 |   const savedRecord = await waitForValue(
  464 |     "saved property record",
  465 |     () => findSavedListing(ownerUserId, sharedState.listingId),
  466 |     Boolean
  467 |   );
  468 |   expect(savedRecord.listingId).toBe(sharedState.listingId);
  469 | 
  470 |   const savedActivities = await waitForValue(
  471 |     "saved property activity",
  472 |     () => findCustomerActivities(sharedState.listingId),
  473 |     (records) => records.some((record) => record.activity_type === "property_saved")
  474 |   );
  475 |   expect(savedActivities.some((record) => record.activity_type === "property_saved")).toBeTruthy();
  476 | 
  477 |   await page.goto("/operations");
  478 |   await expect(
  479 |     page.getByRole("heading", { name: /Property operations control room/i }).first()
  480 |   ).toBeVisible();
  481 | 
  482 |   const inquiryForm = page.locator("form").filter({ hasText: sharedState.guestEmail }).first();
  483 |   await inquiryForm.getByRole("combobox").first().selectOption("assigned");
  484 |   await inquiryForm.getByRole("combobox").nth(1).selectOption({ index: 1 });
  485 |   await inquiryForm.getByRole("button", { name: /Update inquiry/i }).click();
  486 |   await expect(page.getByText(/Workflow updated successfully/i)).toBeVisible();
  487 | 
  488 |   const updatedInquiry = await waitForValue(
  489 |     "updated inquiry status",
  490 |     () => findInquiryByEmail(sharedState.guestEmail),
  491 |     (value) => Boolean(value) && value.status === "assigned"
  492 |   );
  493 |   expect(updatedInquiry.assignedAgentId).toBeTruthy();
  494 | 
  495 |   const viewingForm = page
  496 |     .locator("section")
  497 |     .filter({ hasText: "Viewing scheduling" })
  498 |     .locator("form")
  499 |     .filter({ hasText: sharedState.viewingName })
  500 |     .first();
  501 |   await viewingForm.getByRole("combobox").first().selectOption("scheduled");
  502 |   await viewingForm.locator('input[type="datetime-local"]').fill("2026-04-05T14:30");
  503 |   await viewingForm.getByRole("combobox").nth(1).selectOption({ index: 1 });
  504 |   await viewingForm.getByRole("button", { name: /Update viewing/i }).click();
  505 |   await expect(page.getByText(/Workflow updated successfully/i)).toBeVisible();
  506 | 
  507 |   const updatedViewing = await waitForValue(
  508 |     "updated viewing status",
  509 |     () => findViewingByEmail(sharedState.guestEmail),
  510 |     (value) => Boolean(value) && value.status === "scheduled" && Boolean(value.scheduledFor)
  511 |   );
  512 |   expect(updatedViewing.assignedAgentId).toBeTruthy();
  513 | 
  514 |   const scheduledNotifications = await waitForValue(
  515 |     "viewing scheduled notifications",
  516 |     () => findNotifications(updatedViewing.id),
  517 |     (records) => records.some((record) => record.templateKey === "viewing_scheduled")
  518 |   );
  519 |   expect(
  520 |     scheduledNotifications.some((record) => record.templateKey === "viewing_scheduled")
  521 |   ).toBeTruthy();
  522 | 
  523 |   for (const route of ["/owner", "/agent", "/support", "/admin", "/moderation"]) {
> 524 |     await page.goto(route);
      |                ^ Error: page.goto: Test timeout of 120000ms exceeded.
  525 |     await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  526 |     await expect(page.locator("main")).toBeVisible();
  527 |   }
  528 | });
  529 | 
```