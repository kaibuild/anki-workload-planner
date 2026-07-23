# Anki Workload Planner / Anki負荷プランナー

A calm, deterministic workload planner for understanding and reducing an overwhelming Anki backlog. It is a browser-only, local-first static web application available in English and Japanese.

Live site: [https://anki-workload-planner.pages.dev](https://anki-workload-planner.pages.dev)

Source repository: [https://github.com/kaibuild/anki-workload-planner](https://github.com/kaibuild/anki-workload-planner)

[日本語概要へ](#日本語概要)

## English overview

### Use online

Open the [live application](https://anki-workload-planner.pages.dev). On a first visit, Japanese browser preferences open the Japanese planner, English preferences open the English planner, and unsupported languages fall back to English. You can switch languages at any time without losing the current page or entered data.

1. Enter the overdue backlog and your normal daily review workload on **Plan**.
2. Review the workload source, backlog direction, recommended first adjustment, and estimated one-pass duration.
3. Save optional daily snapshots on **Backlog trend**, and export data only when you want a portable copy.

Planner data stays in this browser's `localStorage` unless you explicitly copy, download, restore, or delete it.

### The common problem

When an Anki workload becomes too heavy, it can be difficult to tell:

1. Where the workload is coming from.
2. Whether the backlog is likely to grow or shrink.
3. Which adjustment would improve the situation most.
4. How long one pass through the current backlog might take.

Anki Workload Planner turns manually entered workload numbers into transparent estimates that answer those four questions. It is a planning aid, not an Anki replacement or scheduler simulator.

### What the app does

- Breaks daily workload into normal reviews, estimated new-card burden, and hard-card overhead.
- Estimates whether genuine overdue backlog is growing, flat, or shrinking under the current daily time limit.
- Estimates days to complete one pass through the current active backlog when capacity is available.
- Compares five deterministic scenarios: current pace, pausing new cards, a target-date plan, reducing active scope, and adding or unsuspending a planned batch.
- Selects one first adjustment using explicit, deterministic rules—never AI-generated advice.
- Checks whether a target-date plan is comfortable, tight, or unrealistic.
- Stores and compares daily backlog snapshots locally, including a seven-day trend when enough data is available.
- Exports a localized plan as text or Markdown, snapshots as CSV, and all local app data as JSON.
- Supports English and Japanese throughout the interface and exported content.
- Provides addressable localized routes at `/en|ja/plan`, `/en|ja/trend`, and `/en|ja/methodology`.

### What the app does not do

- It does not replace Anki or reproduce Anki's exact scheduler.
- It does not connect to Anki, AnkiWeb, AnkiDroid, AnkiMobile, or AnkiConnect.
- It does not log in to an Anki account, upload a collection, or parse `.apkg` or `.anki2` files.
- It does not reset, reschedule, forget, bury, suspend, unsuspend, or delete cards.
- It does not identify which individual cards should be rewritten, suspended, or converted to another card type.
- It does not analyze card content or provide tutoring, medical, or exam-content advice.
- It does not use an LLM or any AI API.
- It has no backend, authentication, cloud database, advertising, or payments.

### Privacy and local-only data model

All calculations run in the browser. User-entered data is stored only in browser `localStorage`; it is not uploaded or included in analytics requests. There are no external fonts, remote icons, advertising SDKs, or custom tracking events.

The production site uses Cloudflare Web Analytics to count aggregate page views and measure page performance. Cloudflare's automatically injected beacon receives the current page path, referrer, broad device/browser information, country, navigation type, and timing metrics. It does not receive planner inputs, snapshots, optional notes, `localStorage` contents, or exported plans. Cloudflare states that Web Analytics does not track individual users across its customers' sites. See [PRIVACY.md](./PRIVACY.md) for the complete disclosure.

The versioned keys are:

- `anki-workload-planner:inputs:v1` for planner inputs.
- `anki-workload-planner:snapshots:v1` for daily snapshots.
- `anki-workload-planner:locale:v1` for the selected language.

Inputs are restored automatically. Malformed or incompatible stored values fall back safely to validated defaults. **Reset plan** restores planner inputs without deleting snapshots. **Delete all local data** removes inputs, snapshots, and locale after confirmation. Downloads and clipboard copies happen only after the user selects an export action.

Data may still be visible to anyone with access to the same device and browser profile. Exported files are ordinary, unencrypted files. See [PRIVACY.md](./PRIVACY.md) and [SECURITY.md](./SECURITY.md) for details.

### Important terminology

These inputs deliberately remain separate:

- **Overdue backlog:** active cards due before today. This is the genuine backlog used by backlog and trend calculations.
- **Due today:** cards scheduled for today. It is shown for context and is never automatically added to overdue backlog.
- **Scheduler queue:** cards Anki currently offers in the active session. It may change during a review session and is never used to derive genuine backlog.
- **Hard or leech cards:** cards that repeatedly fail or take much longer than normal. The planner estimates their extra time only; it does not judge individual cards.

Finishing the current scheduler queue is not presented as finishing all Anki work.

### Calculation methodology

The calculation engine is pure TypeScript and uses the entered planning assumptions. Let:

- `overdueBacklog` be genuine overdue cards.
- `potentiallyTriagedCards` be cards removed from the planning scope for comparison only.
- `dailyMinutes` be the daily time limit.
- `averageSecondsPerReview` be the typical review duration.

The current-pace calculation always uses the full genuine overdue backlog. The reduced-scope scenario is a separate comparison:

```text
currentActiveBacklog = overdueBacklog
reducedScopeActiveBacklog = max(0, overdueBacklog - potentiallyTriagedCards)

dailyAvailableSeconds = dailyMinutes × 60

normalRecurringReviewSeconds =
  typicalDailyReviews × averageSecondsPerReview

newCardReviewSecondsPerDay =
  newCardsPerDay × newCardReviewEquivalent × averageSecondsPerReview

hardCardExtraSecondsPerDay =
  hardCardReviewsPerDay × extraSecondsPerHardReview

recurringDailySeconds =
  normalRecurringReviewSeconds
  + newCardReviewSecondsPerDay
  + hardCardExtraSecondsPerDay

backlogReductionSecondsPerDay =
  dailyAvailableSeconds - recurringDailySeconds

backlogReductionCardsPerDay =
  backlogReductionSecondsPerDay / averageSecondsPerReview
  when the numerator and review time are positive; otherwise 0
```

The backlog is estimated to be **shrinking** when recurring workload is below available time, **flat** when they are equal, and **growing** when recurring workload exceeds available time. The signed daily delta is estimated as `(recurringDailySeconds - dailyAvailableSeconds) / averageSecondsPerReview`: positive means growth and negative means reduction.

When backlog-reduction capacity is positive:

```text
onePassDays = ceil(activeBacklog / backlogReductionCardsPerDay)
```

This result is labeled **“Estimated days to complete one pass through the current backlog.”** It is not an exact recovery or fully-caught-up date.

For the target-date plan, local calendar dates are counted consistently and selected days off are excluded. The planner then calculates:

```text
requiredBacklogReductionPerDay =
  ceil(activeBacklog / workingDaysUntilTarget)

requiredMinutesPerDay =
  (recurringDailySeconds
   + requiredBacklogReductionPerDay × averageSecondsPerReview) / 60
```

Target feasibility is:

- **Comfortable:** required time is at most 70% of the entered daily limit.
- **Tight:** required time is above 70% but no more than the daily limit.
- **Unrealistic:** required time exceeds the daily limit, or a valid plan cannot be calculated.

For a planned addition or unsuspension:

```text
plannedAdditionalCardsPerDay =
  ceil(plannedAdditionalCards / plannedAdditionalCardsDays)
```

That pace is added to the existing new-card pace and evaluated with the same review-equivalent estimate. It is a rough workload comparison, not a prediction of the future Anki queue.

Invalid dates, past target dates, negative or non-finite numbers, zero seconds per review, and an invalid planned-addition duration are reported instead of being silently accepted. Calculations are designed to remain finite and responsive with values up to at least 1,000,000 cards.

### Backlog snapshots and trend

A daily snapshot can include genuine overdue backlog plus contextual values such as due today, current scheduler queue, hard-card count, and a note. Saving the same local calendar date updates that date rather than creating a duplicate. Snapshots can be edited, deleted with confirmation, and exported.

Trend direction, change from the previous snapshot, and the seven-day average use **only `overdueBacklog`**. Due-today and scheduler-queue values never affect the backlog trend.

### Scheduler limitations

These are workload estimates, not exact scheduler predictions. This version does not model the precise results of resetting, rescheduling, forgetting, burying, filtered decks, FSRS changes, or learning/relearning steps. Actual workload depends on recall, card settings, scheduler behavior, future lapses, and study consistency.

Review Anki's own documentation before making destructive scheduling changes.

### Technology

- Vite
- React
- TypeScript with strict types
- Tailwind CSS
- Vitest
- Browser `localStorage`

The production output is a static site. No backend or server route is included.

### Run locally

Prerequisites: Node.js and npm.

```bash
npm install
npm run dev
```

Vite prints the local development URL. Open that URL in a browser.

To preview the production build locally:

```bash
npm run build
npm run preview
```

### Test, lint, and build

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

The static production output is written to `dist/`.

On macOS with Brave installed at its standard path, run the complete copied-Brave suite with:

```bash
npm run qa:brave
```

This command builds the app, copies the complete Brave application into a temporary directory, starts a production preview, and runs E2E and Axe checks with an isolated temporary profile. It never launches the installed application or the user's normal profile, and removes the temporary browser copy and profile afterward. The lower-level `npm run test:e2e` intentionally requires `BRAVE_QA_EXECUTABLE_PATH` to point to a copied Brave executable.

### Deploy

The app can be served from a static host that rewrites nested application routes to `index.html`. HTTPS is recommended so clipboard features work reliably.

#### Cloudflare Pages (production)

- Live site: [https://anki-workload-planner.pages.dev](https://anki-workload-planner.pages.dev)
- Plan: Cloudflare Pages Free
- Production branch: `main`
- GitHub-integrated automatic deployments: enabled
- Build command: `npm run build`
- Output directory: `dist`
- Runtime: static assets plus Cloudflare Web Analytics; no Pages Functions, Workers, backend, or paid Cloudflare resource

Future pushes to `main` automatically build and publish the static site on the generated `*.pages.dev` domain. No custom domain or paid hosting feature is required.

#### Vercel

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

#### GitHub Pages

The checked-in build targets a root/custom-domain deployment. A repository-subpath deployment needs a matching Vite `base` and SPA-fallback strategy.

### Localization

The lightweight localization layer supports `en` and `ja` with typed translation keys. English and Japanese dictionaries must contain identical keys, and that contract is covered by a unit test. Every user-facing string—including validation, scenario copy, recommendations, empty states, disclaimers, confirmation text, and exports—comes from the dictionaries.

Locale precedence is: an explicit supported URL locale, a previously saved manual choice, the first supported value in `navigator.languages`, `navigator.language`, then English. Unsupported browser languages fall back to English. A first visit to `/` uses a replace redirect, while a manual language switch creates a browser-history entry and preserves the current page and data. `<html lang>`, the page title, numbers, and dates follow the active locale.

### Independence and license

**Anki Workload Planner is not affiliated with Anki, AnkiWeb, AnkiDroid, or AnkiMobile.**

The project is available under the [MIT License](./LICENSE).

---

## 日本語概要

ソースコード: [https://github.com/kaibuild/anki-workload-planner](https://github.com/kaibuild/anki-workload-planner)

公開サイト: [https://anki-workload-planner.pages.dev](https://anki-workload-planner.pages.dev)

### オンラインで使う

[公開アプリ](https://anki-workload-planner.pages.dev)を開いてください。初回アクセス時は、ブラウザの言語設定が日本語なら日本語版、英語なら英語版、未対応言語なら英語版を表示します。言語はいつでも切り替えられ、現在のページや入力内容は保持されます。

1. **プラン**で期限超過backlogと普段のレビュー負荷を入力します。
2. 負荷の主因、backlogの増減方向、最初に試す調整、一巡までの推定日数を確認します。
3. 必要に応じて**backlogの推移**で日次スナップショットを保存し、持ち運べるコピーが必要な場合だけ書き出します。

計画データは、コピー・ダウンロード・復元・削除を明示的に実行しない限り、このブラウザの`localStorage`内に留まります。

### 解決する問題

Ankiの負荷が重くなると、次の点が分かりにくくなります。

1. 何が負荷を作っているのか。
2. backlogが今後増えるのか、減るのか。
3. どの調整から始めると最も効果があるのか。
4. 現在のbacklogを一巡するまでに、どのくらいかかりそうか。

Anki負荷プランナーは、手入力した数値を基に、上記4点を透明性のある計算で整理するブラウザ専用の計画ツールです。Ankiの代替やschedulerの再現を目的としたものではありません。

### できること

- 1日の負荷を、通常レビュー、新規カードの推定負荷、難しいカードの追加負荷に分けます。
- 入力した時間上限で、期限超過backlogが増加・横ばい・減少のどれになりそうかを示します。
- 減少に使える余力がある場合、現在のactive backlogを一巡するまでの推定日数を示します。
- 「現在のペース」「新規カードを停止」「目標日プラン」「active scopeを縮小」「カードを追加・unsuspend」の5案を比較します。
- 明示的な固定ルールで、最初に試す調整を1つ提示します。AIによる提案ではありません。
- 目標日が「余裕あり」「厳しい」「非現実的」のどれかを判定します。
- 毎日のbacklogスナップショットをブラウザ内に保存し、十分なデータがあれば7日間の傾向を示します。
- 現在の言語で、計画をテキスト／Markdown、スナップショットをCSV、全ローカルデータをJSONとして書き出します。
- 画面と書き出し内容の両方を英語・日本語に切り替えられます。
- `/en|ja/plan`、`/en|ja/trend`、`/en|ja/methodology`の個別URLを提供します。

### できないこと

- Ankiの代わりにはならず、Ankiのschedulerを正確に再現しません。
- Anki、AnkiWeb、AnkiDroid、AnkiMobile、AnkiConnectには接続しません。
- Ankiアカウントへのログイン、コレクションのアップロード、`.apkg`／`.anki2`の解析は行いません。
- カードのreset、reschedule、forget、bury、suspend、unsuspend、削除は行いません。
- 書き直すべきカード、停止すべきカード、別形式に変えるべきカードを個別に判定しません。
- カード内容の分析、個別指導、医療・試験内容への助言は行いません。
- LLMやAI APIを使用しません。
- backend、認証、クラウドDB、広告、決済はありません。

### プライバシーとローカル保存

すべての計算はブラウザ内で行われます。入力データはブラウザの`localStorage`にだけ保存され、アップロードやアクセス解析の通信には含まれません。外部フォント、リモートアイコン、広告SDK、独自の利用イベント追跡は使用しません。

本番サイトでは、閲覧数とページ表示性能を集計するためCloudflare Web Analyticsを使用します。Cloudflareが自動挿入するbeaconは、現在のページpath、参照元、端末・browserの大まかな情報、国、navigation type、performance timingを受信します。計画の入力値、snapshot、任意メモ、`localStorage`の内容、書き出し内容は送信しません。Cloudflareは、Web Analyticsで顧客サイトをまたいだ個人ユーザーの追跡を行わないと説明しています。詳しくは[PRIVACY.md](./PRIVACY.md)をご覧ください。

使用するversioned keyは次のとおりです。

- `anki-workload-planner:inputs:v1`：計画の入力値
- `anki-workload-planner:snapshots:v1`：日次スナップショット
- `anki-workload-planner:locale:v1`：選択した言語

入力値は次回アクセス時に自動復元されます。保存内容が壊れている、または形式が合わない場合は、検証済みの初期値へ安全に戻ります。**計画をリセット**してもスナップショットは削除されません。**すべてのローカルデータを削除**すると、確認後に入力値・スナップショット・言語設定を削除します。クリップボードへのコピーやファイル保存は、ユーザーが書き出し操作を選んだ場合だけ実行されます。

同じ端末・ブラウザprofileを使える人にはデータを見られる可能性があります。また、書き出したファイルは暗号化されません。詳しくは[PRIVACY.md](./PRIVACY.md)と[SECURITY.md](./SECURITY.md)をご覧ください。

### 用語の区別

次の数値は意図的に分けて扱います。

- **期限超過backlog：** 今日より前が期限で、まだ有効なカード。backlog計算とtrend計算に使う実際のbacklogです。
- **今日が期限のカード：** 今日に設定されたカード。参考表示のみで、期限超過backlogへ自動加算しません。
- **scheduler queue：** 現在のセッションでAnkiが提示しているカード。レビュー中に変化することがあり、実際のbacklogの算出には使いません。
- **leech・難しいカード：** 繰り返し失敗する、または通常より時間がかかるカード。追加時間だけを概算し、個別カードの良し悪しは判定しません。

現在のscheduler queueを終えることを、Anki全体の作業完了とは表現しません。

### 計算方法

計算engineはpure TypeScriptで実装し、入力した前提だけを使います。主な計算は次のとおりです。

```text
currentActiveBacklog = overdueBacklog
reducedScopeActiveBacklog = max(0, overdueBacklog - potentiallyTriagedCards)

dailyAvailableSeconds = dailyMinutes × 60

recurringDailySeconds =
  typicalDailyReviews × averageSecondsPerReview
  + newCardsPerDay × newCardReviewEquivalent × averageSecondsPerReview
  + hardCardReviewsPerDay × extraSecondsPerHardReview

backlogReductionSecondsPerDay =
  dailyAvailableSeconds - recurringDailySeconds

backlogReductionCardsPerDay =
  backlogReductionSecondsPerDay / averageSecondsPerReview
  （backlog削減時間とレビュー秒数が正の場合。それ以外は0）
```

継続的な負荷が利用可能時間より小さければbacklogは**減少**、等しければ**横ばい**、大きければ**増加**と推定します。1日あたりの符号付き変化量は、`(recurringDailySeconds - dailyAvailableSeconds) / averageSecondsPerReview`です。正なら増加、負なら減少を表します。

backlogを減らす余力がある場合は、次の式を使います。

```text
onePassDays = ceil(activeBacklog / backlogReductionCardsPerDay)
```

画面では**「現在のbacklogを一巡するまでの推定日数」**と表示します。正確な復帰日や「完全に追いつく日」を示すものではありません。

目標日プランでは、local calendarの日付を一貫して数え、選択した休み曜日を除外します。

```text
requiredBacklogReductionPerDay =
  ceil(activeBacklog / workingDaysUntilTarget)

requiredMinutesPerDay =
  (recurringDailySeconds
   + requiredBacklogReductionPerDay × averageSecondsPerReview) / 60
```

必要時間が入力した時間上限の70%以下なら「余裕あり」、70%超かつ上限以内なら「厳しい」、上限を超える、または有効な計画を計算できない場合は「非現実的」です。

追加・unsuspend予定のカードは、`ceil(plannedAdditionalCards / plannedAdditionalCardsDays)`で1日あたりに分け、現在の新規カード数へ加えて同じreview-equivalent概算を適用します。将来のAnki queueを正確に予測するものではありません。

無効な日付、過去の目標日、負数や有限でない数、レビュー秒数0、無効な追加期間は黙って補正せず、エラーとして示します。少なくとも1,000,000枚までの値を有限かつ軽量に扱える設計です。

### スナップショットと傾向

日次スナップショットには、期限超過backlogのほか、参考値として今日が期限のカード、現在queue、難しいカード数、メモを保存できます。同じlocal dateに保存すると、重複を作らずその日の内容を更新します。編集、確認付き削除、書き出しが可能です。

前回との差、傾向、7日平均には**`overdueBacklog`だけ**を使います。今日が期限のカードやscheduler queueはtrend計算に影響しません。

### schedulerに関する制限

表示内容は負荷の概算であり、schedulerの正確な予測ではありません。このバージョンでは、reset、reschedule、forget、bury、filtered deck、FSRS変更、learning/relearning stepsの正確な結果は再現しません。実際の負荷は、記憶状況、カード設定、schedulerの動作、今後の失敗、学習継続状況によって変わります。

大きなscheduling変更を行う前に、Anki公式ドキュメントを確認してください。

### ローカルで実行

Node.jsとnpmが必要です。

```bash
npm install
npm run dev
```

production buildをローカルで確認する場合：

```bash
npm run build
npm run preview
```

### テスト・lint・build

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

静的なproduction outputは`dist/`に生成されます。backendやserver routeは含まれません。

macOSの標準パスにBraveがある場合は、コピー版Braveだけを使う再現可能なQAを実行できます。

```bash
npm run qa:brave
```

このcommandはproduction buildとpreview serverを用意し、Brave application全体を一時directoryへ物理コピーして、隔離した一時profileでE2E・Axe検査を実行します。通常インストール版や通常profileは起動せず、終了時に一時copyとprofileを削除します。低レベルの`npm run test:e2e`は、コピー済み実行ファイルを示す`BRAVE_QA_EXECUTABLE_PATH`を必須とし、別browserへfallbackしません。

### デプロイ

ネストしたURLを`index.html`へrewriteできる静的hostingへ配置できます。clipboard機能を安定して使うため、HTTPSを推奨します。

本番環境は[https://anki-workload-planner.pages.dev](https://anki-workload-planner.pages.dev)で公開しています。

- **Cloudflare Pages Free（本番）：** GitHubの`main` branchと連携し、push後に`npm run build`を実行して`dist/`を自動配信します。生成された`*.pages.dev` URLだけを使用し、Cloudflare Web Analyticsを有効にしています。Pages Functions、Workers、backend、有料Cloudflare resourceは使用しません。
- **Vercel：** framework presetはVite、build commandは`npm run build`、output directoryは`dist`。
- **GitHub Pages：** 現在のbuildはroot/custom domain向けです。repository subpathで配信する場合は、Vite `base`とSPA fallbackをそのpathに合わせてください。

### ローカライズ

軽量なtyped localizationで`en`と`ja`を提供します。英語・日本語dictionaryは同じkeyを持ち、unit testで欠落を検出します。validation、scenario、推奨、empty state、免責、確認文、exportを含むすべての表示文言をdictionaryから取得します。

言語の優先順位は、URLに明示された対応locale、保存済みの手動選択、`navigator.languages`内で最初に見つかる対応言語、`navigator.language`、英語fallbackです。未対応のbrowser言語は英語になります。`/`からの初回遷移はhistoryを増やさないreplace、手動切替は現在pageと入力を保ったhistory遷移です。選択言語に合わせて`<html lang>`、page title、数値、日付も更新します。

### 非提携とライセンス

**Anki負荷プランナーは、Anki、AnkiWeb、AnkiDroid、AnkiMobileとは無関係です。**

本プロジェクトは[MIT License](./LICENSE)で提供されます。
