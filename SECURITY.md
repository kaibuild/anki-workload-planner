# Security Policy / セキュリティポリシー

## English

### Supported versions

Security fixes are applied to the current released version and current source. Older builds, forks, and modified deployments may not receive fixes.

| Version | Supported |
| --- | --- |
| Current release / current source | Yes |
| Older or modified versions | No |

### Security model

Anki Workload Planner is a static, browser-only application. It has no project-operated backend, user account, database, cloud sync, analytics, telemetry, Anki integration, or AI API. Planner inputs and snapshots are stored in browser `localStorage`, and calculations and exports run in the browser.

This design reduces server-side exposure, but it does not make local data secret from the device or browser profile:

- `localStorage` is not encrypted by the application.
- Anyone with access to the same unlocked browser profile may be able to read stored data.
- A malicious browser extension, injected script, compromised dependency, or compromised static host could potentially access page data.
- Downloaded exports are ordinary, unencrypted files.
- Static hosting providers may keep their own request logs under their policies; those logs are outside this project.

Do not enter secrets or sensitive personal data in snapshot notes. Use an updated browser, protect the device and browser profile, and remove local data after using a shared device.

### Reporting a vulnerability

Please report suspected vulnerabilities privately.

1. If the source repository offers private security advisories, open a private advisory there.
2. Otherwise, use a private contact method listed by the repository owner or maintainer.
3. Do not include exploit details, local data, or personal information in a public issue. A public issue may be used only to ask for a private reporting channel without disclosing the vulnerability.

Include, when possible:

- A concise description and potential impact.
- Affected version, commit, and deployment URL, if relevant.
- Reproduction steps or a minimal proof of concept.
- Browser, operating system, and relevant extensions.
- Suggested mitigation, if known.
- Whether the issue has been disclosed elsewhere.

Reports are reviewed on a best-effort basis. Maintainers will try to confirm the issue, assess its impact, prepare a fix, and coordinate disclosure, but no response or remediation deadline is guaranteed.

### Scope

Examples of in-scope reports include:

- Cross-site scripting or HTML/script injection in application-controlled content.
- Exposure, corruption, or unintended transmission of planner or snapshot data caused by application code.
- Exported content that can trigger unsafe behavior when opened in an expected workflow.
- A dependency or build configuration that introduces a practical vulnerability in the shipped static application.
- A bypass of confirmation for destructive local-data actions.

Generally out of scope:

- Anki scheduler behavior or vulnerabilities in Anki products.
- Vulnerabilities in a particular hosting provider, browser, extension, operating system, or network that are not caused by this project.
- Loss of data after browser storage is cleared, private mode ends, or a user deletes local data.
- Access by another person who already controls the same unlocked device or browser profile.
- Reports based only on missing security headers that must be configured by the deployer, without a demonstrated application impact.
- Denial-of-service testing, social engineering, physical attacks, or access to another person's data.

There is no bug-bounty program or promise of payment.

### Safe research

Use only accounts, devices, browser profiles, and data you own or are explicitly authorized to test. Avoid privacy violations, service disruption, destructive actions, persistence, and data exfiltration. Stop testing and report the issue if you encounter data that is not yours.

### Deployment guidance

Deployers should:

- Serve the static build over HTTPS.
- Build from reviewed source with a locked dependency graph.
- Keep dependencies and build tooling updated after review and testing.
- Configure appropriate host-level security headers, including a restrictive Content Security Policy where practical.
- Avoid injecting third-party scripts, analytics, remote fonts, or runtime CDN dependencies.

For privacy behavior, see [PRIVACY.md](./PRIVACY.md).

---

## 日本語

### サポート対象

security修正は、現在のreleaseと現在のsourceへ適用します。古いbuild、fork、変更されたdeploymentには修正が提供されない場合があります。

| Version | サポート |
| --- | --- |
| 現在のrelease／現在のsource | 対象 |
| 古いversion／変更版 | 対象外 |

### security model

Anki負荷プランナーは、ブラウザだけで動く静的アプリです。プロジェクトが運用するbackend、ユーザーアカウント、database、cloud sync、analytics、telemetry、Anki連携、AI APIはありません。計画の入力値とスナップショットはbrowserの`localStorage`に保存され、計算と書き出しもブラウザ内で行われます。

この設計はserver側の露出を減らしますが、端末やbrowser profileからローカルデータを秘密にするものではありません。

- アプリは`localStorage`を暗号化しません。
- 同じ解除済みbrowser profileを使える人は、保存内容を閲覧できる可能性があります。
- 悪意のあるbrowser extension、injected script、侵害されたdependencyや静的hostは、page dataへアクセスできる可能性があります。
- downloadしたexportは、暗号化されていない通常のファイルです。
- 静的hosting providerは独自policyに基づきrequest logを保存する場合があります。これは本プロジェクトの管理範囲外です。

スナップショットのメモに秘密情報や機微な個人データを入力しないでください。更新済みbrowserを使い、端末とbrowser profileを保護し、共用端末では使用後にローカルデータを削除してください。

### 脆弱性の報告

脆弱性の可能性がある場合は、非公開で報告してください。

1. source repositoryにprivate security advisory機能がある場合は、非公開advisoryを作成してください。
2. ない場合は、repository ownerまたはmaintainerが案内する非公開の連絡手段を使用してください。
3. exploitの詳細、ローカルデータ、個人情報をpublic issueへ書かないでください。脆弱性を明かさず、非公開窓口だけを尋ねるpublic issueは利用できます。

可能であれば次の情報を含めてください。

- 簡潔な説明と想定される影響。
- 関係するversion、commit、必要に応じてdeployment URL。
- 再現手順または最小限のproof of concept。
- browser、OS、関係するextension。
- 分かる場合は緩和策。
- ほかで公開済みかどうか。

報告はbest-effortで確認します。maintainerは、問題の確認、影響評価、修正、公開時期の調整に努めますが、返信や修正期限を保証するものではありません。

### 対象範囲

対象となる例：

- アプリが管理する内容に対するcross-site scriptingやHTML/script injection。
- アプリのcodeが原因となる、計画・スナップショットデータの漏えい、破損、意図しない送信。
- 想定される手順で開いたexportが危険な動作を引き起こす問題。
- 配布する静的アプリへ実際的な脆弱性を持ち込むdependencyまたはbuild設定。
- ローカルデータを破壊する操作の確認を回避できる問題。

原則として対象外：

- Anki schedulerの動作、またはAnki製品の脆弱性。
- 本プロジェクトに起因しない特定hosting provider、browser、extension、OS、networkの脆弱性。
- browser storageの消去、private modeの終了、ユーザー自身による削除後のデータ消失。
- 同じ解除済み端末・browser profileをすでに操作できる人によるアクセス。
- 実際のアプリへの影響を示さず、deploy側で設定すべきsecurity headerの不足だけを指摘する報告。
- denial-of-service testing、social engineering、物理攻撃、他人のデータへのアクセス。

bug bounty制度や報奨金の約束はありません。

### 安全な調査

自分が所有するか、明示的な許可を得たアカウント、端末、browser profile、データだけを使用してください。privacy侵害、service妨害、破壊的操作、永続化、データ持ち出しを避けてください。自分のものではないデータに遭遇した場合は、調査を中止して報告してください。

### deployment時の注意

deployする方には次を推奨します。

- 静的buildをHTTPSで配信する。
- review済みsourceとlock済みdependency graphからbuildする。
- reviewとtestを行ったうえでdependencyとbuild toolを更新する。
- 可能な範囲で制限的なContent Security Policyなど、適切なhost側security headerを設定する。
- third-party script、analytics、外部font、実行時CDN dependencyを追加しない。

privacy上の動作については[PRIVACY.md](./PRIVACY.md)をご覧ください。
