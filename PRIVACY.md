# Privacy Policy / プライバシーポリシー

Last updated / 最終更新日: 2026-07-16

## English

### Summary

Anki Workload Planner is a browser-only, local-first application. The application itself does not send planner inputs, snapshots, notes, language preferences, or exported plans to a server.

**Your data never leaves this browser unless you explicitly copy or download it and then choose to share it.**

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

- Analytics or telemetry.
- Tracking pixels or advertising SDKs.
- Authentication or Anki account access.
- Anki, AnkiWeb, AnkiDroid, AnkiMobile, or AnkiConnect integration.
- AI or LLM API calls.
- Runtime external fonts, icon services, or CDN resources.

The project therefore does not receive user-entered planner data, IP addresses, browser identifiers, or usage events through application code.

The static hosting provider you use may independently receive ordinary web-request information, such as an IP address and request time, under that provider's own policy. Browser extensions, security products, operating-system services, and networks may also observe activity independently. Those systems are outside this application's control.

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

Anki負荷プランナーは、ブラウザ内で完結するlocal-firstアプリです。計画の入力値、スナップショット、メモ、言語設定、書き出した計画を、アプリ自身がサーバーへ送信することはありません。

**明示的にコピーまたはダウンロードし、その後ご自身で共有しない限り、入力データがこのブラウザの外へ送信されることはありません。**

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

- analytics、telemetry。
- tracking pixel、広告SDK。
- 認証、Ankiアカウントへのアクセス。
- Anki、AnkiWeb、AnkiDroid、AnkiMobile、AnkiConnectとの連携。
- AI／LLM API通信。
- 実行時の外部font、icon service、CDN resource。

そのため、アプリのcodeを通じて、入力した計画データ、IP address、browser identifier、利用eventを本プロジェクトが受信することはありません。

ただし、利用する静的hosting providerは、そのprovider自身のpolicyに基づき、IP addressやrequest時刻など通常のweb request情報を受け取る場合があります。browser extension、security製品、OS service、networkも独立して通信を観測する可能性があります。これらは本アプリの管理範囲外です。

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
