# Privacy Policy / プライバシーポリシー

Last updated / 最終更新日: 2026-07-23

## English

### Summary

Anki Workload Planner is a browser-only, local-first application. Planner inputs, snapshots, notes, and exported plans are processed locally and are not sent to a server by the application.

**Your planner data stays in this browser unless you explicitly copy or download it and then choose to share it. The production site separately uses Cloudflare Web Analytics for aggregate page-view and performance metrics.**

### Data handled by the application

The application may handle the following information that you enter or select:

- Workload planning values, such as overdue backlog, recurring reviews, time limit, review duration, new-card pace, hard-card estimates, planned additions, target date, and days off.
- Daily backlog snapshots and optional notes.
- The selected interface language.

Do not enter secrets or sensitive personal information in the optional note field.

### Where data is stored

The application stores data only in the current browser's `localStorage`, using versioned keys for inputs, snapshots, and locale. It does not use a project-operated backend, user account, cloud database, or cross-device synchronization.

Stored data remains until you:

- Reset applicable settings in the application.
- Use **Delete all local data** and confirm the deletion.
- Clear site data in your browser.
- Use a browser mode or browser policy that removes storage automatically.

Deleting or reinstalling a browser, clearing its profile, or changing devices may also remove the data. The project cannot recover locally deleted data.

### Data transmission and collection

The application does not include:

- Authentication or Anki account access.
- Anki, AnkiWeb, AnkiDroid, AnkiMobile, or AnkiConnect integration.
- AI or LLM API calls.
- External fonts, icon services, advertising SDKs, or custom analytics events.

The production site uses Cloudflare Web Analytics. Cloudflare Pages automatically injects a performance beacon loaded from `static.cloudflareinsights.com`; the current production setup reports to `https://cloudflareinsights.com/cdn-cgi/rum`. The resulting dashboard contains aggregate visits, page views, paths, referrers, country, broad device/browser/operating-system information, navigation type, and page-performance metrics.

The beacon does **not** read cookies, `localStorage`, `sessionStorage`, or IndexedDB. The application does not place planner inputs, snapshots, optional notes, or export contents in analytics requests. Because the interface language is part of the route (`/en/` or `/ja/`), aggregate path metrics can indicate which localized page was viewed. Cloudflare documents that it discards the source IP at the nearest data center instead of storing it in the RUM service's core databases or logs, and that it does not track individual users across customers' sites.

Cloudflare also receives ordinary hosting requests, such as the requested path, source IP, and request time, under its own policies. Browser extensions, security products, operating-system services, and networks may independently observe or block activity. Those systems are outside this application's control.

### Clipboard and downloaded exports

Clipboard and download actions occur only after you select them. Depending on browser settings, clipboard access may require permission. Exported Markdown, CSV, and JSON files are created locally in the browser and are not uploaded by the application.

Exported files are ordinary, unencrypted files. You are responsible for where they are saved, backed up, or shared. Deleting browser storage does not delete files already downloaded or text already copied elsewhere.

### Security and shared devices

Browser `localStorage` is not encrypted by this application. Anyone with access to the same unlocked device and browser profile may be able to view the stored data. Use a separate protected browser profile or clear local data when using a shared or public device.

See [SECURITY.md](./SECURITY.md) for vulnerability reporting and additional security guidance.

### Changes to this policy

Material changes will be documented in this file by updating the date above. Because the application has no account or contact database, it cannot send individual policy-change notices.

### Questions

For a non-sensitive privacy question, use the source repository's issue tracker when one is available. Do not publish security-sensitive information in a public issue; follow the private reporting guidance in [SECURITY.md](./SECURITY.md).

---

## 日本語

### 概要

Anki負荷プランナーは、ブラウザ内で完結するlocal-firstアプリです。計画の入力値、スナップショット、メモ、書き出した計画はローカルで処理され、アプリがサーバーへ送信することはありません。

**計画データは、明示的にコピーまたはダウンロードし、その後ご自身で共有しない限り、このブラウザ内に残ります。本番サイトではこれとは別に、閲覧数と表示性能を集計するCloudflare Web Analyticsを使用します。**

### アプリが扱うデータ

入力・選択した次の情報を扱う場合があります。

- 期限超過backlog、継続的なレビュー数、時間上限、レビュー秒数、新規カードのペース、難しいカードの概算、追加予定、目標日、休み曜日などの計画値。
- 日次backlogスナップショットと任意のメモ。
- 画面で選択した言語。

任意のメモ欄には、秘密情報や機微な個人情報を入力しないでください。

### 保存場所

データは、現在使用しているブラウザの`localStorage`にだけ保存します。入力値・スナップショット・言語設定にはversioned keyを使用します。プロジェクトが運用するbackend、ユーザーアカウント、クラウドDB、端末間同期はありません。

保存データは、次の操作が行われるまで残ります。

- アプリ内で対象設定をリセットする。
- **すべてのローカルデータを削除**を選び、削除を確認する。
- ブラウザのsite dataを消去する。
- browser modeや管理policyによってstorageが自動削除される。

ブラウザの削除・再install、profileの消去、端末変更でもデータが失われる場合があります。ローカルで削除されたデータを本プロジェクトが復元することはできません。

### 送信と収集

このアプリには次の機能を含めません。

- 認証、Ankiアカウントへのアクセス。
- Anki、AnkiWeb、AnkiDroid、AnkiMobile、AnkiConnectとの連携。
- AI／LLM API通信。
- 外部font、icon service、広告SDK、独自のanalytics event。

本番サイトではCloudflare Web Analyticsを使用します。Cloudflare Pagesが`static.cloudflareinsights.com`からperformance beaconを自動挿入し、現在の本番設定では`https://cloudflareinsights.com/cdn-cgi/rum`へ送信します。dashboardでは、集計された訪問、page view、path、参照元、国、端末・browser・OSの大まかな情報、navigation type、ページ表示性能を確認できます。

beaconはcookie、`localStorage`、`sessionStorage`、IndexedDBを読み取りません。計画の入力値、snapshot、任意メモ、書き出し内容をanalytics requestへ含めるcodeもありません。画面の言語はroute（`/en/`または`/ja/`）に含まれるため、集計pathからどちらの言語ページが閲覧されたかは分かります。Cloudflareは、source IPを最寄りのdata centerで破棄し、RUM serviceのcore databaseやlogへ保存しないこと、顧客siteをまたいで個人ユーザーを追跡しないことを説明しています。

Cloudflareは静的hostingの通常処理として、request path、source IP、request時刻なども自身のpolicyに基づいて受け取ります。browser extension、security製品、OS service、networkが通信を独立して観測または遮断する場合もあります。これらは本アプリの管理範囲外です。

### clipboardと書き出しファイル

clipboardへのコピーとdownloadは、ユーザーが操作を選んだ場合だけ実行します。browser設定によってはclipboard権限が必要です。Markdown、CSV、JSONはブラウザ内で作成され、アプリがuploadすることはありません。

書き出したファイルは暗号化されていない通常のファイルです。保存先、backup、共有はユーザーご自身で管理してください。ブラウザのstorageを削除しても、すでにdownloadしたファイルやほかの場所へコピーしたtextは削除されません。

### securityと共用端末

このアプリはbrowserの`localStorage`を暗号化しません。同じ解除済み端末・browser profileを使える人は、保存データを閲覧できる可能性があります。共用・公共端末では、保護された別profileを使うか、使用後にローカルデータを削除してください。

脆弱性の報告方法と追加のsecurity情報は[SECURITY.md](./SECURITY.md)をご覧ください。

### policyの変更

重要な変更は、このファイルの最終更新日を更新して記録します。アカウントや連絡先DBがないため、変更を個別に通知することはできません。

### お問い合わせ

機微ではないprivacy上の質問は、利用可能な場合、source repositoryのissue trackerを利用してください。security上の機微情報をpublic issueへ投稿せず、[SECURITY.md](./SECURITY.md)の非公開報告手順に従ってください。
