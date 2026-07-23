import axe from 'axe-core'
import { chromium } from 'playwright-core'
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join, relative, resolve, sep } from 'node:path'
import process from 'node:process'

const PRODUCT_PREFIX = 'anki-workload-planner:'
const INPUTS_KEY = `${PRODUCT_PREFIX}inputs:v1`
const SNAPSHOTS_KEY = `${PRODUCT_PREFIX}snapshots:v1`
const LOCALE_KEY = `${PRODUCT_PREFIX}locale:v1`
const executablePath = await validateCopiedBrave(process.env.BRAVE_QA_EXECUTABLE_PATH)
const baseUrl = validateBaseUrl(process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173')
const allowedRuntimeOrigin = new URL(baseUrl).origin
const artifactsDir = resolve(process.env.QA_ARTIFACT_DIR ?? 'artifacts/qa')
const screenshotsDir = join(artifactsDir, 'screenshots')
const harPath = join(artifactsDir, 'copied-brave-network.har')
const axePath = join(artifactsDir, 'axe-results.json')
const profileParent = process.env.BRAVE_QA_COPY_ROOT
  ? resolve(process.env.BRAVE_QA_COPY_ROOT)
  : resolve(tmpdir())
const headless = process.env.BRAVE_QA_HEADED !== '1'

await mkdir(screenshotsDir, { recursive: true })

const results = []
const profiles = new Set()
const consoleErrors = []
const pageErrors = []
const failedRequests = []
const unexpectedRequests = []
const harEntries = []
const axeReports = []
let contextSequence = 0

try {
  await test('Japanese first-visit locale detection', async () => {
    await withBrowser({ locale: 'ja-JP' }, async ({ page }) => {
      await goto(page, '/')
      await assertLocalizedPage(page, 'ja', 'plan')
    })
  })

  await test('English first-visit locale detection', async () => {
    await withBrowser({ locale: 'en-US' }, async ({ page }) => {
      await goto(page, '/')
      await assertLocalizedPage(page, 'en', 'plan')
    })
  })

  await test('Unsupported first-visit locale falls back to English', async () => {
    await withBrowser({ locale: 'fr-FR' }, async ({ page }) => {
      await goto(page, '/')
      await assertLocalizedPage(page, 'en', 'plan')
    })
  })

  await test('Saved Japanese choice overrides a later English browser locale', async () => {
    const profile = await makeProfile()
    await withBrowser({ locale: 'en-US', profile, keepProfile: true }, async ({ page }) => {
      await goto(page, '/en/plan')
      await page.getByRole('button', { name: '日本語', exact: true }).click()
      await waitForPath(page, '/ja/plan')
      equal(await page.evaluate((key) => localStorage.getItem(key), LOCALE_KEY), 'ja', 'Japanese preference was not saved.')
    })
    await withBrowser({ locale: 'en-US', profile, keepProfile: true }, async ({ page }) => {
      await goto(page, '/')
      await assertLocalizedPage(page, 'ja', 'plan')
      await goto(page, '/en/trend')
      await assertLocalizedPage(page, 'en', 'trend')
    })
  })

  await test('Saved English choice overrides a later Japanese browser locale', async () => {
    const profile = await makeProfile()
    await withBrowser({ locale: 'ja-JP', profile, keepProfile: true }, async ({ page }) => {
      await goto(page, '/ja/plan')
      await page.getByRole('button', { name: 'English', exact: true }).click()
      await waitForPath(page, '/en/plan')
      equal(await page.evaluate((key) => localStorage.getItem(key), LOCALE_KEY), 'en', 'English preference was not saved.')
    })
    await withBrowser({ locale: 'ja-JP', profile, keepProfile: true }, async ({ page }) => {
      await goto(page, '/')
      await assertLocalizedPage(page, 'en', 'plan')
      await goto(page, '/ja/methodology')
      await assertLocalizedPage(page, 'ja', 'methodology')
    })
  })

  await test('Localized routing, direct loading, reload, and browser history', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1440, height: 900 } }, async ({ page }) => {
      await goto(page, '/en/plan')
      await assertLocalizedPage(page, 'en', 'plan')
      await screenshot(page, 'desktop-en-plan.png')

      await page.getByRole('link', { name: 'Backlog trend', exact: true }).click()
      await waitForPath(page, '/en/trend')
      await assertCurrentNavigation(page, 'Backlog trend')
      await page.getByRole('link', { name: 'Methodology & privacy', exact: true }).click()
      await waitForPath(page, '/en/methodology')
      await assertCurrentNavigation(page, 'Methodology & privacy')

      await page.goBack()
      await waitForPath(page, '/en/trend')
      await page.goBack()
      await waitForPath(page, '/en/plan')
      await page.goForward()
      await waitForPath(page, '/en/trend')
      await page.goForward()
      await waitForPath(page, '/en/methodology')

      await page.getByRole('button', { name: '日本語', exact: true }).click()
      await waitForPath(page, '/ja/methodology')
      await waitForDocumentLanguage(page, 'ja')
      await screenshot(page, 'language-switch.png')
      await page.goBack()
      await waitForPath(page, '/en/methodology')
      await page.goForward()
      await waitForPath(page, '/ja/methodology')

      await goto(page, '/en/trend')
      await page.getByRole('link', { name: 'Anki Workload Planner', exact: true }).click()
      await waitForPath(page, '/en/plan')

      for (const locale of ['en', 'ja']) {
        for (const appPage of ['plan', 'trend', 'methodology']) {
          await goto(page, `/${locale}/${appPage}`)
          await assertLocalizedPage(page, locale, appPage)
          await page.reload({ waitUntil: 'load' })
          await assertLocalizedPage(page, locale, appPage)
        }
      }

      await goto(page, '/ja/not-a-real-page')
      await assertLocalizedPage(page, 'ja', 'plan')
      await goto(page, '/xx/not-a-real-page')
      await assertLocalizedPage(page, 'ja', 'plan')
    })
  })

  await test('Form completion, advanced settings, demos, and scenario calculations', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1440, height: 900 } }, async ({ page }) => {
      await goto(page, '/en/plan')
      await clearProductData(page)
      await page.reload({ waitUntil: 'load' })

      await fillPlanner(page, {
        overdueBacklog: 2000,
        typicalDailyReviews: 180,
        dailyMinutes: 45,
        averageSecondsPerReview: 8,
        newCardsPerDay: 20,
        targetDate: localDate(14),
      })
      await assertFourAnswers(page)
      await assertFiniteVisibleResults(page)
      assert((await page.locator('#scenarios-heading').locator('xpath=..').innerText()).includes('Pause new cards'), 'Pause-new-cards scenario is missing.')

      await openAdvanced(page)
      for (const id of [
        'dueToday',
        'schedulerQueueNow',
        'hardCardCount',
        'hardCardReviewsPerDay',
        'extraSecondsPerHardReview',
        'newCardReviewEquivalent',
        'plannedAdditionalCards',
        'plannedAdditionalCardsDays',
        'potentiallyTriagedCards',
      ]) {
        assert(await page.locator(`#planner-${id}`).isVisible(), `Advanced input ${id} is not visible.`)
      }
      const advancedSettings = page.locator('#planner-dueToday').locator('xpath=ancestor::details[1]')
      await advancedSettings.locator('summary').click()
      assert(!(await advancedSettings.evaluate((element) => element.open)), 'Advanced settings did not collapse.')
      await advancedSettings.locator('summary').click()
      assert(await advancedSettings.evaluate((element) => element.open), 'Advanced settings did not reopen after collapsing.')

      await fillPlanner(page, { overdueBacklog: 1000, dueToday: 200, schedulerQueueNow: 350 })
      const beforeContextChange = await page.locator('section[aria-labelledby="result-heading"]').innerText()
      await fillPlanner(page, { dueToday: 500, schedulerQueueNow: 50 })
      const afterContextChange = await page.locator('section[aria-labelledby="result-heading"]').innerText()
      equal(afterContextChange, beforeContextChange, 'Due-today or scheduler-queue context changed the core result.')
      equal(await page.locator('#planner-overdueBacklog').inputValue(), '1000', 'Context fields changed genuine overdue backlog.')

      await loadDemo(page, 'moderate', 'Load demo')
      equal(await page.locator('#planner-typicalDailyReviews').inputValue(), '180', 'Moderate demo did not load.')
      await loadDemo(page, 'extreme', 'Load demo')
      equal(await page.locator('#planner-overdueBacklog').inputValue(), '22000', 'Extreme demo did not load 22,000 cards.')
      equal(await page.locator('#planner-hardCardCount').inputValue(), '2500', 'Extreme demo hard-card count is wrong.')
      assert((await page.locator('section[aria-labelledby="breakdown-heading"]').innerText()).includes('hard-card overhead'), 'Hard-card overhead is not visible.')
      await assertFiniteVisibleResults(page)
      await screenshot(page, 'extreme-workload.png')

      await fillPlanner(page, {
        overdueBacklog: 0,
        typicalDailyReviews: 150,
        dailyMinutes: 45,
        averageSecondsPerReview: 8,
        newCardsPerDay: 0,
        hardCardCount: 0,
        hardCardReviewsPerDay: 0,
        plannedAdditionalCards: 0,
      })
      assert((await page.locator('section[aria-labelledby="result-heading"]').innerText()).includes('No active overdue backlog'), 'Zero-backlog state is not explained.')
      await assertFiniteVisibleResults(page)

      await fillPlanner(page, {
        overdueBacklog: 500,
        typicalDailyReviews: 150,
        dailyMinutes: 45,
        averageSecondsPerReview: 25,
        newCardsPerDay: 10,
      })
      const adjustmentCard = page.locator('section[aria-labelledby="result-heading"] dl > div').filter({ hasText: 'Which first adjustment is most likely to help?' })
      assert((await adjustmentCard.innerText()).includes('Time per review'), 'Long-card recommendation is not driven by review time.')

      await loadDemo(page, 'planned', 'Load demo')
      const scenarioCards = page.locator('section[aria-labelledby="scenarios-heading"] article')
      equal(await scenarioCards.count(), 5, 'Expected five scenario cards.')
      const additionScenario = scenarioCards.nth(4)
      await openDetails(additionScenario.locator('details'), 'Planned-addition scenario')
      const additionText = await additionScenario.innerText()
      assert(additionText.includes('115 cards/day'), 'Planned addition daily pace is not visible.')
      assert(additionText.includes('Growing'), 'Planned addition does not show the mathematically changed direction.')
      await screenshot(page, 'planned-card-addition.png')

      await page.getByRole('link', { name: 'Backlog trend', exact: true }).click()
      await waitForPath(page, '/en/trend')
      await page.getByRole('link', { name: 'Methodology & privacy', exact: true }).click()
      await waitForPath(page, '/en/methodology')
      await page.goBack()
      await page.goBack()
      await waitForPath(page, '/en/plan')
      equal(await page.locator('#planner-plannedAdditionalCards').inputValue(), '800', 'Form values were lost during navigation.')
    })
  })

  await test('Invalid planner inputs are explained without unstable results', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1280, height: 800 } }, async ({ page }) => {
      await goto(page, '/en/plan')
      await openAdvanced(page)
      await fillPlanner(page, {
        overdueBacklog: -1,
        averageSecondsPerReview: 0,
        plannedAdditionalCards: 10,
        plannedAdditionalCardsDays: 0,
        potentiallyTriagedCards: 5,
        targetDate: localDate(-1),
      })
      for (const checkbox of await page.locator('fieldset input[type="checkbox"]').all()) await checkbox.check()
      assert(await page.locator('[aria-invalid="true"]').count() >= 5, 'Invalid inputs were not marked in place.')
      assert(await page.getByRole('alert').count() > 0, 'Invalid input state is not announced.')
      assert((await page.locator('body').innerText()).includes('Fix the highlighted inputs'), 'Invalid results explanation is missing.')
      await assertNoBadNumberText(page)
      await screenshot(page, 'validation-error.png')

      await page.locator('#planner-overdueBacklog').fill('')
      assert((await page.locator('#planner-overdueBacklog-error').innerText()).includes('valid number'), 'Empty numeric input does not show validation.')
      await page.locator('#planner-overdueBacklog').fill('1.5')
      assert((await page.locator('#planner-overdueBacklog-error').innerText()).includes('whole number'), 'Decimal card count does not show integer validation.')
      await page.locator('#planner-overdueBacklog').fill('1000001')
      assert((await page.locator('#planner-overdueBacklog-error').innerText()).includes('supported maximum'), 'Maximum input validation is missing.')
    })
  })

  await test('Snapshots save, replace, edit, conflict-check, persist, and delete', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1440, height: 900 } }, async ({ page }) => {
      await goto(page, '/en/plan')
      await clearProductData(page)
      await page.reload({ waitUntil: 'load' })
      await page.locator('#planner-overdueBacklog').fill('600')
      await page.getByRole('link', { name: 'Backlog trend', exact: true }).click()
      await waitForPath(page, '/en/trend')

      await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
      await assertSnapshotCount(page, 1)
      await openSnapshotForm(page)
      await page.locator('#snapshot-date').fill(localDate(-1))
      await page.locator('#snapshot-overdue').fill('700')
      await page.locator('#snapshot-note').fill('Local note <script>alert(1)</script>')
      await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
      await assertSnapshotCount(page, 2)
      assert((await page.locator('section[aria-labelledby="trend-heading"]').innerText()).includes('<script>alert(1)</script>'), 'Snapshot note was not safely rendered as text.')
      equal(await page.locator('script').filter({ hasText: 'alert(1)' }).count(), 0, 'Snapshot note created an executable script node.')

      await openSnapshotForm(page)
      await page.locator('#snapshot-date').fill(localDate(-1))
      await page.locator('#snapshot-overdue').fill('675')
      await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
      await assertSnapshotCount(page, 2)
      assert((await page.locator('section[aria-labelledby="trend-heading"]').innerText()).includes('675'), 'Same-date snapshot was not updated.')

      const olderRow = page.locator('section[aria-labelledby="trend-heading"] article').filter({ hasText: '675' }).first()
      await olderRow.getByRole('button', { name: 'Edit', exact: true }).click()
      await page.locator('#snapshot-overdue').fill('650')
      await page.getByRole('button', { name: 'Update snapshot', exact: true }).click()
      await assertSnapshotCount(page, 2)
      assert((await page.locator('section[aria-labelledby="trend-heading"]').innerText()).includes('650'), 'Snapshot edit did not update the value.')

      const editedRow = page.locator('section[aria-labelledby="trend-heading"] article').filter({ hasText: '650' }).first()
      await editedRow.getByRole('button', { name: 'Edit', exact: true }).click()
      await page.locator('#snapshot-date').fill(localDate(0))
      await page.getByRole('button', { name: 'Update snapshot', exact: true }).click()
      assert((await page.locator('#snapshot-date-error').innerText()).includes('Another snapshot'), 'Duplicate-date edit conflict was not explained.')
      await page.getByRole('button', { name: 'Cancel editing', exact: true }).click()

      await page.reload({ waitUntil: 'load' })
      await assertSnapshotCount(page, 2)
      await screenshot(page, 'desktop-en-trend.png')
      await page.getByRole('button', { name: '日本語', exact: true }).click()
      await waitForPath(page, '/ja/trend')
      await screenshot(page, 'desktop-ja-trend.png')
      await page.getByRole('button', { name: 'English', exact: true }).click()
      await waitForPath(page, '/en/trend')

      const firstDelete = page.locator('section[aria-labelledby="trend-heading"] article').first().getByRole('button', { name: 'Delete', exact: true })
      await firstDelete.click()
      const dialog = page.getByRole('dialog')
      assert(await dialog.isVisible(), 'Snapshot delete confirmation did not open.')
      await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
      await assertSnapshotCount(page, 1)
    })
  })

  await test('Clipboard, downloads, reset, and delete-all data controls', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1280, height: 800 } }, async ({ context, page }) => {
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(baseUrl).origin })
      await goto(page, '/en/plan')
      await clearProductData(page)
      await page.reload({ waitUntil: 'load' })
      await page.locator('#planner-overdueBacklog').fill('900')
      await page.getByRole('link', { name: 'Backlog trend', exact: true }).click()
      await page.getByRole('button', { name: 'Save snapshot', exact: true }).click()
      await page.getByRole('link', { name: 'Plan', exact: true }).click()

      await page.getByRole('button', { name: 'Copy plan as text', exact: true }).click()
      await page.waitForFunction(() => document.body.innerText.includes('Plan copied to the clipboard.'))
      const clipboard = await page.evaluate(() => navigator.clipboard.readText())
      assert(clipboard.includes('Anki Workload Plan'), 'Clipboard export is not English or is empty.')

      const markdown = await downloadText(page, 'Download plan as Markdown')
      assert(markdown.name.endsWith('.md') && markdown.content.includes('# Anki Workload Plan'), 'English Markdown download is invalid.')
      const csv = await downloadText(page, 'Export snapshots as CSV')
      assert(csv.name.endsWith('.csv') && csv.content.includes('Overdue backlog'), 'CSV download is invalid.')
      const json = await downloadText(page, 'Download all local data as JSON')
      const backup = JSON.parse(json.content)
      assert(Array.isArray(backup.snapshots) && backup.snapshots.length === 1, 'JSON download is missing snapshot data.')

      await page.getByRole('button', { name: '日本語', exact: true }).click()
      const japaneseMarkdown = await downloadText(page, 'プランをMarkdownでダウンロード')
      assert(japaneseMarkdown.content.includes('# Anki負荷プラン'), 'Japanese Markdown download is not localized.')
      await page.getByRole('button', { name: 'English', exact: true }).click()

      await page.locator('#planner-overdueBacklog').fill('1234')
      await openLocalDataControls(page)
      const resetButton = page.getByRole('button', { name: 'Reset plan', exact: true })
      await resetButton.click()
      let dialog = page.getByRole('dialog')
      assert(await dialog.isVisible(), 'Reset confirmation did not open.')
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      equal(await page.locator('#planner-overdueBacklog').inputValue(), '1234', 'Canceling reset changed the plan.')
      await resetButton.click()
      dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Reset plan inputs', exact: true }).click()
      equal(await page.locator('#planner-overdueBacklog').inputValue(), '0', 'Reset did not restore defaults.')
      await page.getByRole('link', { name: 'Backlog trend', exact: true }).click()
      await assertSnapshotCount(page, 1)
      await page.getByRole('link', { name: 'Plan', exact: true }).click()

      await page.evaluate(() => localStorage.setItem('unrelated-owner:key', 'keep-me'))
      await openLocalDataControls(page)
      const deleteAll = page.getByRole('button', { name: 'Delete all local data', exact: true })
      await deleteAll.click()
      dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
      assert((await productStorageKeys(page)).length > 0, 'Canceling delete-all removed product data.')
      await deleteAll.click()
      dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: 'Delete all local data', exact: true }).click()
      await waitForPath(page, '/en/plan')
      equal((await productStorageKeys(page)).length, 0, 'Delete-all left product-owned localStorage keys.')
      equal(await page.evaluate(() => localStorage.getItem('unrelated-owner:key')), 'keep-me', 'Delete-all removed unrelated localStorage data.')
    })
  })

  await test('Malformed and outdated localStorage recover safely', async () => {
    await withBrowser({ locale: 'en-US' }, async ({ page }) => {
      await goto(page, '/en/plan')
      await page.evaluate(({ inputsKey, snapshotsKey }) => {
        localStorage.setItem(inputsKey, '{not-json')
        localStorage.setItem(snapshotsKey, '{also-not-json')
        localStorage.setItem('anki-workload-planner:inputs:v0', JSON.stringify({ overdueBacklog: 999999 }))
      }, { inputsKey: INPUTS_KEY, snapshotsKey: SNAPSHOTS_KEY })
      await page.reload({ waitUntil: 'load' })
      equal(await page.locator('#planner-overdueBacklog').inputValue(), '0', 'Malformed storage did not recover to safe defaults.')
      await page.getByRole('link', { name: 'Backlog trend', exact: true }).click()
      await assertSnapshotCount(page, 0)
      await assertNoBadNumberText(page)
    })
  })

  await test('Responsive layouts, touch targets, and 200% effective zoom', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1440, height: 900 } }, async ({ context, page }) => {
      await goto(page, '/en/plan')
      const viewports = [
        [320, 568],
        [360, 800],
        [390, 844],
        [430, 932],
        [768, 1024],
        [1024, 768],
        [1280, 800],
        [1440, 900],
        [1920, 1080],
        [844, 390],
      ]
      for (const [width, height] of viewports) {
        await page.setViewportSize({ width, height })
        await page.evaluate(() => window.scrollTo(0, 0))
        await assertNoHorizontalOverflow(page, `${width}x${height}`)
        await assertTouchTargets(page, `${width}x${height}`)
        if (width === 320 && height === 568) await screenshot(page, 'mobile-320-en.png')
        if (width === 768 && height === 1024) await screenshot(page, 'tablet-768.png')
      }

      await page.setViewportSize({ width: 390, height: 844 })
      await page.getByRole('button', { name: '日本語', exact: true }).click()
      await waitForPath(page, '/ja/plan')
      await assertNoHorizontalOverflow(page, '390x844 Japanese')
      await screenshot(page, 'mobile-390-ja.png')
      await screenshot(page, 'desktop-ja-plan.png', { viewport: { width: 1440, height: 900 } })

      await page.setViewportSize({ width: 320, height: 568 })
      await page.getByRole('link', { name: 'backlogの推移', exact: true }).click()
      await waitForPath(page, '/ja/trend')
      await page.getByRole('link', { name: '仕組みと制限', exact: true }).click()
      await waitForPath(page, '/ja/methodology')
      await assertNoHorizontalOverflow(page, 'mobile navigation')

      await page.getByRole('button', { name: 'English', exact: true }).click()
      await page.setViewportSize({ width: 1440, height: 900 })
      await screenshot(page, 'desktop-methodology.png')

      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: 720,
        height: 450,
        deviceScaleFactor: 2,
        mobile: false,
        screenWidth: 1440,
        screenHeight: 900,
      })
      await goto(page, '/en/plan')
      equal(await page.evaluate(() => window.innerWidth), 720, '200% zoom emulation did not halve the CSS viewport.')
      equal(await page.evaluate(() => window.devicePixelRatio), 2, '200% zoom emulation did not use a 2x scale.')
      await assertNoHorizontalOverflow(page, '200% effective zoom')
      await cdp.send('Emulation.clearDeviceMetricsOverride')
    })
  })

  await test('Critical/serious accessibility and keyboard checks', async () => {
    await withBrowser({ locale: 'en-US', viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }, async ({ page }) => {
      for (const locale of ['en', 'ja']) {
        for (const appPage of ['plan', 'trend', 'methodology']) {
          await goto(page, `/${locale}/${appPage}`)
          equal(await page.locator('h1').count(), 1, `${locale}/${appPage} does not have exactly one H1.`)
          await runAxe(page, `${locale}/${appPage}`)
        }
      }

      assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), 'Reduced-motion preference was not applied.')
      await goto(page, '/en/plan')
      await page.keyboard.press('Tab')
      const skipLink = page.getByRole('link', { name: 'Skip to main content', exact: true })
      assert(await skipLink.evaluate((element) => element === document.activeElement), 'The skip link was not the first keyboard focus target.')
      await page.keyboard.press('Enter')
      await page.waitForFunction(() => document.activeElement?.id === 'main-content')
      equal(await page.evaluate(() => document.activeElement?.id), 'main-content', 'The skip link did not move focus to main content.')
      await openAdvanced(page)
      await runAxe(page, 'en/plan advanced-open')
      await openLocalDataControls(page)
      const resetButton = page.getByRole('button', { name: 'Reset plan', exact: true })
      await resetButton.click()
      const dialog = page.getByRole('dialog')
      assert(await dialog.isVisible(), 'Keyboard dialog test could not open the dialog.')
      assert(await dialog.locator(':focus').count() === 1, 'Dialog did not receive focus.')
      equal(await page.evaluate(() => document.activeElement?.textContent?.trim()), 'Cancel', 'Dialog did not place initial focus on Cancel.')
      await runAxe(page, 'en/plan reset-dialog')
      await page.keyboard.press('Escape')
      assert(!(await dialog.isVisible()), 'Escape did not close the dialog.')
      assert(await resetButton.evaluate((element) => element === document.activeElement), 'Dialog did not return focus to its trigger.')
    })
  })

  await test('Required screenshots were generated', async () => {
    const required = [
      'desktop-en-plan.png',
      'desktop-ja-plan.png',
      'desktop-en-trend.png',
      'desktop-ja-trend.png',
      'desktop-methodology.png',
      'mobile-320-en.png',
      'mobile-390-ja.png',
      'tablet-768.png',
      'extreme-workload.png',
      'planned-card-addition.png',
      'language-switch.png',
      'validation-error.png',
    ]
    for (const name of required) {
      const info = await stat(join(screenshotsDir, name)).catch(() => null)
      assert(info?.isFile() && info.size > 0, `Required screenshot is missing: ${name}`)
    }
  })

  await test('No browser errors, failed requests, or unexpected outbound traffic', async () => {
    equal(consoleErrors.length, 0, formatDiagnostics('Console errors', consoleErrors))
    equal(pageErrors.length, 0, formatDiagnostics('Page errors', pageErrors))
    equal(failedRequests.length, 0, formatDiagnostics('Failed requests', failedRequests))
    equal(unexpectedRequests.length, 0, formatDiagnostics('Unexpected external requests', unexpectedRequests))
  })
} finally {
  await writeHar()
  await writeFile(axePath, `${JSON.stringify(axeReports, null, 2)}\n`, 'utf8')
  await cleanupProfiles()
}

const failures = results.filter((result) => result.status === 'FAIL')
console.log('\nCopied Brave E2E summary')
for (const result of results) console.log(`${result.status.padEnd(4)} ${result.name}${result.detail ? ` — ${result.detail}` : ''}`)
console.log(`\n${results.length - failures.length}/${results.length} checks passed`)
console.log(`Brave executable: ${executablePath}`)
console.log(`HAR: ${harPath}`)
console.log(`Axe report: ${axePath}`)
if (failures.length > 0) process.exitCode = 1

async function test(name, fn) {
  const started = Date.now()
  try {
    await fn()
    results.push({ name, status: 'PASS', detail: `${Date.now() - started} ms` })
  } catch (error) {
    const detail = error instanceof Error ? error.stack ?? error.message : String(error)
    results.push({ name, status: 'FAIL', detail: detail.replaceAll('\n', ' | ') })
  }
}

async function withBrowser(options, callback) {
  const profile = options.profile ?? await makeProfile()
  const contextId = `context-${++contextSequence}`
  const context = await chromium.launchPersistentContext(profile, {
    executablePath,
    headless,
    acceptDownloads: true,
    locale: options.locale ?? 'en-US',
    viewport: options.viewport ?? { width: 1440, height: 900 },
    reducedMotion: options.reducedMotion ?? 'no-preference',
    serviceWorkers: 'block',
    args: [
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-domain-reliability',
      '--disable-features=AutofillServerCommunication,OptimizationHints,PrivacySandboxSettings4',
      '--metrics-recording-only',
      '--remote-debugging-port=0',
    ],
  })
  monitorContext(context, contextId)
  const page = context.pages()[0] ?? await context.newPage()
  page.setDefaultTimeout(10_000)
  try {
    return await callback({ context, page, profile })
  } finally {
    await context.close()
    if (!options.keepProfile) await removeProfile(profile)
  }
}

function monitorContext(context, contextId) {
  const pending = new Map()
  context.on('page', (page) => monitorPage(page, contextId))
  for (const page of context.pages()) monitorPage(page, contextId)
  context.on('request', (request) => {
    const started = Date.now()
    const entry = {
      _context: contextId,
      startedDateTime: new Date(started).toISOString(),
      time: 0,
      request: {
        method: request.method(),
        url: request.url(),
        httpVersion: 'HTTP/1.1',
        cookies: [],
        headers: objectHeaders(request.headers()),
        queryString: queryString(request.url()),
        headersSize: -1,
        bodySize: request.postDataBuffer()?.byteLength ?? 0,
      },
      response: {
        status: 0,
        statusText: '',
        httpVersion: 'HTTP/1.1',
        cookies: [],
        headers: [],
        content: { size: 0, mimeType: '' },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      },
      cache: {},
      timings: { send: 0, wait: 0, receive: 0 },
    }
    pending.set(request, { entry, started })
    harEntries.push(entry)
    if (!isAllowedRuntimeRequest(request)) {
      unexpectedRequests.push(`${request.method()} ${request.url()} (${contextId})`)
    }
  })
  context.on('response', (response) => {
    const record = pending.get(response.request())
    if (!record) return
    const elapsed = Date.now() - record.started
    record.entry.time = elapsed
    record.entry.timings.wait = elapsed
    record.entry.response.status = response.status()
    record.entry.response.statusText = response.statusText()
    record.entry.response.headers = objectHeaders(response.headers())
    record.entry.response.content.mimeType = response.headers()['content-type'] ?? ''
  })
  context.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText ?? 'unknown failure'
    failedRequests.push(`${request.method()} ${request.url()}: ${reason} (${contextId})`)
    const record = pending.get(request)
    if (record) {
      record.entry.time = Date.now() - record.started
      record.entry.response._error = reason
    }
  })
}

function monitorPage(page, contextId) {
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${message.text()} (${page.url()}, ${contextId})`)
  })
  page.on('pageerror', (error) => pageErrors.push(`${error.message} (${page.url()}, ${contextId})`))
}

async function makeProfile() {
  const profile = await mkdtemp(join(profileParent, 'anki-planner-e2e-profile-'))
  profiles.add(profile)
  return profile
}

async function removeProfile(profile) {
  const normalized = resolve(profile)
  const normalizedParent = `${resolve(profileParent)}${sep}`
  if (!normalized.startsWith(normalizedParent) || !normalized.split(sep).at(-1)?.startsWith('anki-planner-e2e-profile-')) {
    throw new Error(`Refusing to remove unexpected browser profile: ${normalized}`)
  }
  await rm(normalized, { recursive: true, force: true })
  profiles.delete(normalized)
}

async function cleanupProfiles() {
  for (const profile of [...profiles]) await removeProfile(profile)
}

async function goto(page, path) {
  const response = await page.goto(new URL(path, baseUrl).href, { waitUntil: 'load' })
  assert(response?.ok(), `Navigation to ${path} failed with HTTP ${response?.status() ?? 'no response'}.`)
  await page.locator('main').waitFor({ state: 'visible' })
}

async function waitForPath(page, pathname) {
  await page.waitForFunction((expected) => location.pathname === expected, pathname)
  equal(new URL(page.url()).pathname, pathname, `Expected browser path ${pathname}.`)
}

async function assertLocalizedPage(page, locale, appPage) {
  await waitForPath(page, `/${locale}/${appPage}`)
  await waitForDocumentLanguage(page, locale)
  equal(await page.locator('h1').count(), 1, `Expected one H1 on ${locale}/${appPage}.`)
  const expectedTitle = {
    en: {
      plan: 'Plan | Anki Workload Planner',
      trend: 'Backlog trend | Anki Workload Planner',
      methodology: 'Methodology and privacy | Anki Workload Planner',
    },
    ja: {
      plan: 'プラン | Anki負荷プランナー',
      trend: 'backlogの推移 | Anki負荷プランナー',
      methodology: '計算方法とプライバシー | Anki負荷プランナー',
    },
  }[locale][appPage]
  equal(await page.title(), expectedTitle, `Document title is wrong for ${locale}/${appPage}.`)
  const expectedDescription = locale === 'ja'
    ? 'ログイン・アップロード・backend・AIを使わず、ブラウザ内で動くAnki負荷計画ツールです。'
    : 'A browser-only, bilingual Anki workload and backlog planning tool. No login, uploads, backend, or AI.'
  equal(await page.locator('meta[name="description"]').getAttribute('content'), expectedDescription, `Meta description is wrong for ${locale}/${appPage}.`)
  const removedSourceLabel = locale === 'ja' ? 'ソースを見る' : 'View source'
  equal(await page.getByRole('link', { name: removedSourceLabel, exact: true }).count(), 0, `The removed source link is visible on ${locale}/${appPage}.`)
  await assertCurrentNavigation(page, locale === 'ja'
    ? { plan: 'プラン', trend: 'backlogの推移', methodology: '仕組みと制限' }[appPage]
    : { plan: 'Plan', trend: 'Backlog trend', methodology: 'Methodology & privacy' }[appPage])
}

async function waitForDocumentLanguage(page, locale) {
  await page.waitForFunction((expectedLocale) => document.documentElement.lang === expectedLocale, locale)
  equal(await page.locator('html').getAttribute('lang'), locale, `html lang is wrong for ${locale}.`)
}

async function assertCurrentNavigation(page, label) {
  const currentLink = page.getByRole('link', { name: label, exact: true })
  await currentLink.waitFor({ state: 'visible' })
  await page.waitForFunction(
    (currentLabel) => [...document.querySelectorAll('a')].some((link) => (
      link.textContent?.trim() === currentLabel && link.getAttribute('aria-current') === 'page'
    )),
    label,
  )
  equal(await currentLink.getAttribute('aria-current'), 'page', `Current navigation is not announced for ${label}.`)
}

async function clearProductData(page) {
  await page.evaluate((prefix) => {
    for (const key of Object.keys(localStorage)) if (key.startsWith(prefix)) localStorage.removeItem(key)
  }, PRODUCT_PREFIX)
}

async function productStorageKeys(page) {
  return await page.evaluate((prefix) => Object.keys(localStorage).filter((key) => key.startsWith(prefix)).sort(), PRODUCT_PREFIX)
}

async function openAdvanced(page) {
  const details = page.locator('#planner-dueToday').locator('xpath=ancestor::details[1]')
  if (!(await details.evaluate((element) => element.open))) await details.locator('summary').click()
  assert(await details.evaluate((element) => element.open), 'Advanced settings did not expand.')
}

async function fillPlanner(page, values) {
  const advancedFields = new Set([
    'dueToday',
    'schedulerQueueNow',
    'hardCardCount',
    'hardCardReviewsPerDay',
    'extraSecondsPerHardReview',
    'newCardReviewEquivalent',
    'plannedAdditionalCards',
    'plannedAdditionalCardsDays',
    'potentiallyTriagedCards',
  ])
  if (Object.keys(values).some((key) => advancedFields.has(key))) await openAdvanced(page)
  for (const [field, value] of Object.entries(values)) {
    await page.locator(`#planner-${field}`).fill(String(value))
  }
}

async function loadDemo(page, id, buttonName) {
  const details = page.locator('#demo-select').locator('xpath=ancestor::details[1]')
  await openDetails(details, 'Demo picker')
  await page.locator('#demo-select').selectOption(id)
  await page.getByRole('button', { name: buttonName, exact: true }).click()
  await page.getByText('Demo data loaded.', { exact: true }).waitFor()
}

async function openLocalDataControls(page) {
  const details = page.locator('section[aria-labelledby="export-heading"] details')
  await openDetails(details, 'Local data controls')
}

async function openDetails(details, label) {
  if (!(await details.evaluate((element) => element.open))) await details.locator('summary').click()
  assert(await details.evaluate((element) => element.open), `${label} did not open.`)
}

async function assertFourAnswers(page) {
  const result = page.locator('section[aria-labelledby="result-heading"]')
  const visibleText = await result.innerText()
  for (const question of [
    'What is making the workload heavy?',
    'Is the backlog estimated to grow or shrink?',
    'Which first adjustment is most likely to help?',
    'How long may one pass through the current backlog take?',
  ]) {
    assert(visibleText.includes(question), `Common-pain answer is missing: ${question}`)
  }
  equal(await result.locator('dt').count(), 4, 'The four primary answers are not visibly grouped.')
}

async function assertFiniteVisibleResults(page) {
  await assertNoBadNumberText(page)
  assert(await page.locator('section[aria-labelledby="result-heading"]').isVisible(), 'Result summary is not visible.')
}

async function assertNoBadNumberText(page) {
  const body = await page.locator('body').innerText()
  assert(!/(^|\W)(NaN|Infinity)(\W|$)/.test(body), 'The UI rendered NaN or Infinity.')
}

async function openSnapshotForm(page) {
  const details = page.locator('section[aria-labelledby="trend-heading"] details')
  if (!(await details.evaluate((element) => element.open))) await details.locator('summary').click()
  assert(await details.evaluate((element) => element.open), 'Snapshot form did not open.')
}

async function assertSnapshotCount(page, expected) {
  equal(await page.locator('section[aria-labelledby="trend-heading"] article').count(), expected, `Expected ${expected} snapshots.`)
}

async function downloadText(page, buttonName) {
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: buttonName, exact: true }).click()
  const download = await pending
  const failure = await download.failure()
  assert(failure === null, `Download ${buttonName} failed: ${failure}`)
  const path = await download.path()
  assert(path, `Download ${buttonName} has no temporary file.`)
  return { name: download.suggestedFilename(), content: await readFile(path, 'utf8') }
}

async function assertNoHorizontalOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    html: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))
  assert(dimensions.html <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1,
    `${label} has page-level horizontal overflow: ${JSON.stringify(dimensions)}`)
}

async function assertTouchTargets(page, label) {
  const undersized = await page.evaluate(() => {
    const selectors = 'button, summary, nav a, input:not([type="checkbox"]):not([type="hidden"]), select'
    return [...document.querySelectorAll(selectors)]
      .filter((element) => {
        const style = getComputedStyle(element)
        const box = element.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 0 && box.height > 0
      })
      .map((element) => {
        const box = element.getBoundingClientRect()
        return { name: element.getAttribute('aria-label') || element.textContent?.trim() || element.id, width: box.width, height: box.height }
      })
      .filter((item) => item.width < 43 || item.height < 43)
  })
  equal(undersized.length, 0, `${label} has undersized touch targets: ${JSON.stringify(undersized.slice(0, 8))}`)
}

async function runAxe(page, label) {
  await page.evaluate(axe.source)
  const violations = await page.evaluate(async () => {
    const report = await globalThis.axe.run(document, {
      resultTypes: ['violations'],
      rules: { 'color-contrast': { enabled: true } },
    })
    return report.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.slice(0, 5).map((node) => node.target),
      }))
  })
  axeReports.push({ page: label, violations })
  equal(violations.length, 0, `${label} has Axe violations: ${JSON.stringify(violations)}`)
}

async function screenshot(page, name, options = {}) {
  if (options.viewport) await page.setViewportSize(options.viewport)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    window.scrollTo(0, 0)
    const skipLink = document.querySelector('.skip-link')
    if (skipLink instanceof HTMLElement) skipLink.style.display = 'none'
  })
  try {
    await page.screenshot({
      path: join(screenshotsDir, name),
      fullPage: true,
      animations: 'disabled',
    })
  } finally {
    await page.evaluate(() => {
      const skipLink = document.querySelector('.skip-link')
      if (skipLink instanceof HTMLElement) skipLink.style.removeProperty('display')
    })
  }
}

function localDate(offset) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isAllowedRuntimeRequest(request) {
  try {
    const value = request.url()
    const url = new URL(value)
    if (['data:', 'blob:', 'about:'].includes(url.protocol)) return true
    if (['http:', 'https:'].includes(url.protocol)) {
      if (url.origin === allowedRuntimeOrigin) return true
      return (
        request.method() === 'GET'
        && url.origin === 'https://static.cloudflareinsights.com'
        && url.pathname === '/beacon.min.js'
        && url.search === ''
      ) || (
        request.method() === 'POST'
        && url.origin === 'https://cloudflareinsights.com'
        && url.pathname === '/cdn-cgi/rum'
        && url.search === ''
      )
    }
    if (['ws:', 'wss:'].includes(url.protocol)) {
      const allowed = new URL(baseUrl)
      return url.hostname === allowed.hostname && url.port === allowed.port
    }
    return false
  } catch {
    return false
  }
}

function objectHeaders(headers) {
  return Object.entries(headers).map(([name, value]) => ({ name, value }))
}

function queryString(value) {
  try {
    return [...new URL(value).searchParams].map(([name, item]) => ({ name, value: item }))
  } catch {
    return []
  }
}

async function writeHar() {
  await writeFile(harPath, `${JSON.stringify({
    log: {
      version: '1.2',
      creator: { name: 'Anki Workload Planner copied-Brave QA', version: '1' },
      pages: [],
      entries: harEntries,
    },
  }, null, 2)}\n`, 'utf8')
}

function formatDiagnostics(label, values) {
  return values.length === 0 ? `${label}: none` : `${label}:\n${values.map((value) => `- ${value}`).join('\n')}`
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function equal(actual, expected, message) {
  if (actual !== expected) throw new Error(`${message} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`)
}

function validateBaseUrl(value) {
  const url = new URL(value)
  const loopback = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]', '::1'].includes(url.hostname)
  const productionPages = process.env.QA_ALLOW_EXTERNAL === '1'
    && url.protocol === 'https:'
    && url.hostname.endsWith('.pages.dev')
    && !url.username
    && !url.password
  if (!loopback && !productionPages) {
    throw new Error('QA_BASE_URL must be an HTTP loopback URL, or an HTTPS pages.dev URL with QA_ALLOW_EXTERNAL=1.')
  }
  return `${url.origin}/`
}

async function validateCopiedBrave(value) {
  if (!value?.trim()) {
    throw new Error('BRAVE_QA_EXECUTABLE_PATH is required. Use npm run qa:brave to create and test a physical Brave copy.')
  }
  const candidate = resolve(value)
  const info = await lstat(candidate).catch(() => null)
  if (!info?.isFile() || info.isSymbolicLink()) {
    throw new Error('BRAVE_QA_EXECUTABLE_PATH must point to a regular executable inside a physical Brave app copy.')
  }

  const candidateRealPath = await realpath(candidate)
  const copyRoot = process.env.BRAVE_QA_COPY_ROOT?.trim()
  if (copyRoot) {
    const rootRealPath = await realpath(resolve(copyRoot))
    const pathFromRoot = relative(rootRealPath, candidateRealPath)
    if (pathFromRoot === '' || pathFromRoot.startsWith(`..${sep}`) || pathFromRoot === '..') {
      throw new Error('BRAVE_QA_EXECUTABLE_PATH is outside BRAVE_QA_COPY_ROOT.')
    }
  }

  const appMarker = `${sep}Contents${sep}MacOS${sep}`
  const markerIndex = candidateRealPath.lastIndexOf(appMarker)
  if (markerIndex < 0 || !candidateRealPath.slice(0, markerIndex).endsWith('.app')) {
    throw new Error('The QA executable must be inside a complete macOS .app bundle.')
  }
  const appRoot = candidateRealPath.slice(0, markerIndex)
  const resources = await stat(join(appRoot, 'Contents/Resources')).catch(() => null)
  if (!resources?.isDirectory()) throw new Error('The Brave QA app copy is incomplete (Contents/Resources is missing).')

  const originalApps = [
    '/Applications/Brave Browser.app',
    '/Applications/Brave Browser Beta.app',
    '/Applications/Brave Browser Nightly.app',
    join(homedir(), 'Applications/Brave Browser.app'),
    process.env.BRAVE_QA_SOURCE_APP_PATH,
  ].filter(Boolean).map((path) => resolve(path))
  for (const originalApp of originalApps) {
    if (candidate === originalApp || candidate.startsWith(`${originalApp}${sep}`)) {
      throw new Error(`Refusing to launch a normal Brave installation: ${candidate}`)
    }
    const originalExecutable = join(originalApp, 'Contents/MacOS/Brave Browser')
    const originalRealPath = await realpath(originalExecutable).catch(() => null)
    if (originalRealPath && candidateRealPath === originalRealPath) {
      throw new Error(`Refusing a symlink or alias to a normal Brave installation: ${candidate}`)
    }
  }
  return candidateRealPath
}
