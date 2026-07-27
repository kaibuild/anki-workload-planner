import type { Translation } from './types'

export const ja = {
  meta: {
    documentTitle: 'Anki負荷プランナー',
    description: 'ログイン・アップロード・backend・AIを使わず、ブラウザ内で動くAnki負荷計画ツールです。',
    pageTitles: {
      plan: 'プラン | Anki負荷プランナー',
      trend: 'backlogの推移 | Anki負荷プランナー',
      methodology: '計算方法とプライバシー | Anki負荷プランナー',
    },
    productName: 'Anki負荷プランナー',
    headline: 'Ankiの負荷が手に負えなくなる前に、状況と対策を把握する。',
    subheadline:
      'レビュー負荷の原因を分解し、現実的な調整案を比較して、backlogが増えるか減るかを確認できます。',
  },
  language: {
    label: '言語',
    switcherLabel: '表示言語を選択',
    english: 'English',
    japanese: '日本語',
  },
  navigation: {
    primary: 'メインナビゲーション',
    skipToContent: '本文へ移動',
    plan: 'プラン',
    trend: 'backlogの推移',
    methodology: '仕組みと制限',
  },
  pages: {
    plan: {
      eyebrow: '負荷プラン',
      title: 'Ankiの負荷を、無理のない計画に。',
      description: '現在の数値から、負荷の原因、増減、最初の調整、一巡の概算を確認します。',
    },
    trend: {
      eyebrow: 'ブラウザ内の記録',
      title: '期限超過backlogの変化を確認する。',
      description: '日付ごとの記録を保存します。今日が期限のカードと現在のqueueは参考値です。',
    },
    methodology: {
      eyebrow: '透明性のある概算',
      title: 'このプランナーの仕組みと限界。',
      description: '計算方法、Anki用語、ローカル保存、schedulerを正確に再現できない理由を説明します。',
    },
  },
  trust: {
    strip: 'ブラウザ内で完結 · ログイン不要 · アップロードなし · AI不使用',
    localOnly: '保存先はこのブラウザだけです。',
    noConnection:
      'Anki、AnkiWeb、AnkiDroid、AnkiMobileとは接続しません。',
  },
  form: {
    heading: '現在の負荷を入力',
    description:
      '現在のAnki負荷が分かる概算値を入力してください。結果は入力に合わせて更新されます。',
    simpleMode: 'まずここから',
    advancedSettings: '詳細設定',
    showAdvanced: '詳細設定を開く',
    hideAdvanced: '詳細設定を閉じる',
    requiredHint: '必須項目には印があります。',
    fields: {
      overdueBacklog: {
        label: '今日より前が期限の未処理カード',
        helper:
          '今日より前が期限で、まだ未処理のカード数を入力してください。今日が期限のカードは含めません。',
      },
      typicalDailyReviews: {
        label: '普段その日に期限を迎えるレビュー数',
        helper:
          '上で入力した期限超過カードと、その日に追加する新規カードを除き、普段その日に必要になるReviewカード数の目安を入力してください。',
      },
      dailyMinutes: {
        label: '1日のAnki上限時間',
        helper: 'Ankiに無理なく使える、1稼働日あたりの最大時間です。',
      },
      averageSecondsPerReview: {
        label: '1レビューあたりの平均秒数',
        helper: '分かる場合は、最近の標準的な平均値を使ってください。',
      },
      newCardsPerDay: {
        label: '1日あたりの新規カード数',
        helper: '新規カードは、将来のレビュー負荷を生みます。',
      },
      targetDate: {
        label: '目標日',
        helper: '期限超過として入力したカードを一巡したい期日です。',
      },
      dueToday: {
        label: '今日が期限のカード',
        helper:
          '参考情報として表示します。期限超過backlogには自動加算しません。',
      },
      schedulerQueueNow: {
        label: '現在schedulerに表示されているqueue',
        helper:
          '現在のセッション中に変化する数値です。実際のbacklogとは別のものです。',
      },
      hardCardCount: {
        label: '既知のleech・難しいカード数',
        helper:
          '参考情報のみ。この数だけではレビュー頻度が分からないため、単独では負荷の計算に使用しません。',
      },
      hardCardReviewsPerDay: {
        label: '1日あたりの難しいカードのレビュー数',
        helper: '推定に使用します。普段1日に遭遇する難しいカードのレビュー回数を入力してください。',
      },
      extraSecondsPerHardReview: {
        label: '難しいカード1回あたりの追加秒数',
        helper: '推定に使用します。通常の平均レビュー時間を超える分を入力してください。',
      },
      newCardReviewEquivalent: {
        label: '新規カード1枚あたりの将来レビュー負荷',
        helper:
          '計画用の概算値です。実際のAnki schedulingはこれより複雑です。',
      },
      plannedAdditionalCards: {
        label: '追加・一時停止解除予定のカード数',
        helper: 'デッキ、タグ、またはバッチの追加が継続可能かを比較します。',
      },
      plannedAdditionalCardsDays: {
        label: '追加にかける日数',
        helper: '予定しているカードを、この日数に分けて追加する前提です。',
      },
      potentiallyTriagedCards: {
        label: '一時的に対象範囲から外す候補カード',
        helper:
          '比較用の入力です。このツールがAnki内のカードを変更・一時停止することはありません。',
      },
      daysOff: {
        label: 'Ankiを休む曜日',
        helper: '選択した曜日は、目標日プランの稼働日から除外します。',
      },
    },
    hardCards: {
      heading: '難しいカードの負荷',
      description:
        '既知のleech・難しいカード数だけでは負荷の計算に使用されません。時間への影響を見積もるには、普段1日に何回それらのカードをレビューするかを入力してください。',
      usedInEstimate: '推定に使用',
      contextOnly: '参考情報のみ',
      previewLabel: '難しいカードによる推定追加時間',
      previewMissingReviews:
        '現在、難しいカードによる追加時間は計算に含まれていません。負荷へ反映するには、1日あたりの難しいカードのレビュー数を入力してください。',
      previewMissingExtraSeconds:
        '現在、難しいカードによる追加時間は計算に含まれていません。1レビューあたりの追加秒数を0より大きくしてください。',
      collapsedIncluded: '難しいカードの追加負荷を反映中',
      collapsedShort: '難しいカード',
    },
    inputSemantics: {
      overdueColorWarning:
        '赤・緑などの表示数をそのまま入力しないでください。カードの色だけではoverdueかどうかは判断できません。',
      overdueConfirmation:
        'これらが今日より前に期限を迎えたカードであることを確認してください。赤・緑の表示数が、そのままoverdueカード数になるわけではありません。',
      findOverdueTitle: 'この数値の確認方法',
      findOverdueIntro: 'Anki Desktopの場合：',
      findOverdueStepBrowse: 'Browseを開き、Cardsモードにします。',
      findOverdueStepSearch: '次の条件で検索します：',
      findOverdueQuery: 'prop:due<=-1',
      findOverdueStepCount: '検索結果のカード数を使用します。',
      findOverdueExplanation:
        'この検索は、今日より前が期限で、まだoverdueのカードを表示します。',
      findOverdueDoNotGuess:
        'この数値を確認できない場合は、カードの色から推測しないでください。',
      dailyReviewStatsWarning:
        'Anki Statsの「review count」をそのまま入力しないでください。Statsは回答回数を数えるため、同じLearning・Relearningカードが複数回含まれることがあります。',
      dailyReviewEstimateNote:
        '概算で構いません。Learning中のカードや難しいカードによって時間が長くなる場合は、「1レビューあたりの平均秒数」または難しいカードの設定へ反映してください。期限超過カード数と普段のReviewカード数は、同じデッキまたはコレクション範囲で見積もってください。',
      quickGuideTitle: 'どの数値をどこへ入力しますか？',
      quickGuideOverdueTerm: '今日より前が期限の未処理カード',
      quickGuideOverdueDefinition:
        '期限を過ぎても未処理のカードです。BrowseのCardsモードでprop:due<=-1を使って確認できます。',
      quickGuideReviewsTerm: '普段その日に期限を迎えるレビュー数',
      quickGuideReviewsDefinition:
        '期限超過backlogとその日の新規カードを除いた、普段のReview負荷です。',
      quickGuideNewCardsTerm: '1日あたりの新規カード数',
      quickGuideNewCardsDefinition:
        '毎日新しく学習へ追加するカード数です。',
      quickGuideSecondsTerm: '1レビューあたりの平均秒数',
      quickGuideSecondsDefinition:
        '1回答にかかるおよその時間です。長いsentence cardでは大きめに設定します。',
    },
    weekdays: {
      monday: '月曜日',
      tuesday: '火曜日',
      wednesday: '水曜日',
      thursday: '木曜日',
      friday: '金曜日',
      saturday: '土曜日',
      sunday: '日曜日',
    },
    validation: {
      heading: '入力内容を確認してください',
      invalidNumber: '有効な数値を入力してください。',
      negativeNumber: '0以上の数値を入力してください。',
      zeroReviewTime: '1レビューあたりの平均秒数は0より大きくしてください。',
      nonInteger: 'カード数と日数は整数で入力してください。',
      aboveMaximum: '対応している上限以下の値を入力してください。',
      triageExceedsBacklog: '対象範囲から外すカード数は、期限超過backlog以下にしてください。',
      allDaysOff: '目標日プランには、少なくとも1つ稼働する曜日を残してください。',
      invalidTargetDate: '有効な目標日を入力してください。',
      pastTargetDate: '過去の日付は目標日に設定できません。',
      plannedDaysRequired:
        'カードを追加・unsuspendする場合は、追加にかける日数を1日以上にしてください。',
      fixBeforeResults: '信頼できるプランを計算するため、入力エラーを修正してください。',
    },
    resetPlan: 'プランをリセット',
  },
  demo: {
    label: 'デモを読み込む',
    placeholder: 'デモを選択',
    moderate: '中規模backlog',
    extreme: '極端な負荷',
    growing: '負荷が増加中',
    plannedAddition: 'デッキ追加予定',
    loaded: '上に表示された入力定義に沿うデモデータを読み込みました。',
  },
  summary: {
    heading: '現在のプラン',
    description: 'まず確認すること。',
    heavyQuestion: '何が負荷を重くしている？',
    directionQuestion: 'backlogは増える見込みか、減る見込みか？',
    adjustmentQuestion: '最初に何を調整すると効果が大きい？',
    onePassQuestion: '期限超過として入力したカードを一巡するまで、どのくらいかかりそうですか？',
    heavyNormal: '普段その日に期限を迎えるReviewカードが、継続的な負荷の最大要因です。',
    heavyNewCards: '新規カードが、推定される継続的な負荷の最大要因です。',
    heavyHardCards: '難しいカードの追加時間が、日次負荷の無視できない要因です。',
    heavySlowReviews: '1回のレビュー時間が主な制約です。カード数が少なくても、1枚に時間がかかると1日の上限を超えます。',
    heavyBacklog: '現在の期限超過backlogが、改善に向けた最大の課題です。',
    noRecurringLoad: '継続的なレビュー負荷はまだ入力されていません。',
    directionGrowing:
      '継続的な負荷が1日の処理能力を超えるため、backlogは増える見込みです。',
    directionFlat:
      '継続的な負荷だけで利用可能な時間を使い切るため、backlogは横ばいの見込みです。',
    directionShrinking:
      '期限超過カードに使える時間が残るため、backlogは減る見込みです。',
    directionNoBacklogGrowing: '今日より前が期限の未処理カードは入力されていませんが、継続負荷が1日の上限を超えており、今後backlogが生じるおそれがあります。',
    directionNoBacklogFlat: '今日より前が期限の未処理カードは入力されていませんが、継続負荷だけで1日の上限を使い切っています。',
    directionNoBacklogCapacity: '今日より前が期限の未処理カードは入力されておらず、現在の継続負荷には余力があります。',
    onePassLabel: '期限超過として入力したカードを一巡する推定学習日数',
    onePassUnavailable: '現在のペースではbacklogを減らす余力がありません',
    onePassComplete: '今日より前が期限の未処理カードは入力されていません',
  },
  direction: {
    growing: '増加',
    flat: '横ばい',
    shrinking: '減少',
  },
  feasibility: {
    comfortable: '余裕あり',
    tight: '厳しめ',
    unrealistic: '現実的ではない',
  },
  breakdown: {
    heading: '1日の負荷の内訳',
    description:
      'まず継続的な負荷に時間を使い、残りのbacklogを減らすために使えます。',
    normalReviews: '普段その日に期限を迎えるReviewカード',
    normalReviewsHelp: '期限超過として入力したカードと新規カードを除き、普段の日に期限を迎えるReviewカードです。',
    newCardBurden: '新規カードの推定負荷',
    newCardBurdenHelp: '現在の新規カードペースが生む、将来のレビュー相当負荷です。',
    hardCardOverhead: '難しいカードの推定追加時間',
    hardCardOverheadHelp: '難しいカードが通常の平均より多く消費する時間です。',
    hardCardNotIncluded:
      '現在、難しいカードによる追加時間は計算に含まれていません。負荷へ反映するには、1日あたりの難しいカードのレビュー数を入力してください。',
    hardCardCountContextOnly:
      '既知の難しいカード数は参考情報のみです。1日あたりの難しいカードのレビュー数が0のため、追加負荷は計算に含まれていません。',
    hardCardMissingExtraSeconds:
      '1レビューあたりの追加秒数が0のため、難しいカードの追加負荷は計算に含まれていません。',
    recurringTotal: '継続的な1日の総負荷',
    recurringTotalHelp: '普段のレビュー、新規カードの推定負荷、難しいカードの追加時間を含みます。',
    backlogTime: 'backlogの削減に使える時間',
    backlogTimePositive: 'この時間を期限超過カードに使えます。',
    backlogTimeNone: '継続的な負荷が、すでに1日の上限時間以上です。',
    hardCardImpactHeading: '難しいカードの推定影響',
    hardCardImpactDescription:
      '難しいカードの追加負荷がない同じプランとの比較です。個々のカードを診断するものではありません。',
    hardCardAddedTime: '1日あたりの追加時間',
    hardCardReducedCapacity: '1日あたりに減るbacklog処理量',
    hardCardOnePass: '一巡の推定',
    hardCardOnePassUnchanged: '日数単位では変化なし',
    withoutHardCardOverhead: '難しいカードの追加負荷なし',
  },
  scenarios: {
    heading: '主な調整案を比較',
    description: '変更されるのは計画上の入力だけで、Anki内は何も変更されません。',
    roughEstimate: '概算値であり、Ankiの将来のscheduler queueを再現するものではありません。',
    current: {
      title: '現在のペース',
      description: '現在の時間上限と新規カードペースを続ける場合です。',
      recurringWorkload: '継続的な1日の負荷',
      backlogTime: 'backlogに使える残り時間',
      backlogReductionCapacity: 'backlogを減らせる上限',
      estimatedBacklogGrowth: 'backlogの推定増加',
      estimatedBacklogChange: 'backlogの推定変化',
      reductionCapacityValue: '1日あたり最大{cards}',
      growthValue: '1日あたり+{cards}',
      flatValue: '1日あたり{cards}',
      fitsWithinOneDay:
        '今日より前が期限の未処理カードとして{backlog}が入力されています。入力した時間上限では、その{backlog}を1回ずつ処理する作業は{studyDays}以内に収まる見込みです。これは、今日のLearning・Relearning・Reviewを含むAnki作業全体が終わるという意味ではありません。',
      direction: '推定方向',
      onePass: '一巡するまでの推定',
      target: '目標日の実現性',
    },
    pause: {
      title: '新規カードを停止',
      description: '1日あたりの新規カード数を一時的に0にします。',
      reduction: '1日あたりのbacklog削減数',
      onePass: '新しい一巡日数の推定',
      minutesFreed: '1日あたりに空く時間',
      difference: '現在のペースとの差',
      improvesBy: '1日あたりに追加で減らせるbacklog数',
      noChange: 'すでに新規カードを停止しているため、変化はありません。',
    },
    target: {
      title: '目標日プラン',
      description: '目標日までのbacklogを一巡するために必要なペースを概算します。',
      workingDays: '利用できる稼働日',
      backlogPerDay: '1日あたりに必要なbacklogレビュー数',
      totalReviews: '1日あたりの推定総レビュー数',
      minutes: '1日あたりに必要な時間',
      feasibility: '実現性',
      unavailable: '現在の入力では目標日プランを計算できません。',
      adjustmentsHeading: '目標をより現実的にする方法',
      extendDate: '目標日を延長する',
      increaseTime: '1日の時間を増やす',
      pauseNewCards: '新規カードを停止する',
      reduceScope: '対象範囲を縮小する',
      unrealisticExplanation: '必要な1日時間が上限を超えています。目標日を延ばすか負荷を変えるまで、実現可能な値として扱わないでください。',
    },
    reduceScope: {
      title: '対象範囲を縮小',
      description: '現在のbacklog全体と、一時的に縮小した計画対象を比較します。',
      before: '縮小前の対象backlog',
      after: '縮小後の対象backlog',
      onePassChange: '一巡日数の推定変化',
      noSelection: '比較するには、対象範囲から外す候補カード数を入力してください。',
      disclaimer:
        'この比較では計画上の対象範囲だけを変更します。Anki内のカードを一時停止・変更することはありません。',
    },
    addCards: {
      title: 'カードを追加・一時停止解除',
      description: '予定しているデッキ、タグ、またはバッチの追加が継続可能かを比較します。',
      addedPerDay: '1日あたりの推定追加カード数',
      workloadChange: '継続的な負荷の推定変化',
      direction: '追加後のbacklogの方向',
      target: '追加後の目標日の実現性',
      noBatch: '比較するには、追加予定のカード数を入力してください。',
    },
  },
  recommendations: {
    heading: '最初におすすめする調整',
    deterministic: 'ルールに基づく提案 · AI不使用',
    noBacklog:
      '今日より前が期限の未処理カードは入力されていません。カードを増やす前に、継続負荷を1日の上限内に保ってください。',
    plannedCardsGrow:
      'このカード追加では負荷が増える可能性があります。追加期間を延ばすか、開始を遅らせてください。',
    targetUnrealistic:
      '現在の時間上限では目標日に間に合いません。目標日の延長、時間の追加、新規カードの停止、対象範囲の縮小を検討してください。',
    extendTargetDate:
      'まず目標日を延ばしてください。現在のペースでもbacklogは減りますが、選択した日までには一巡できません。',
    pauseNewCards:
      'まず新規カードを一時停止し、方向がどう変わるかを確認してから次の調整を決めてください。',
    reduceRecurringLoad:
      'まず普段のレビュー負荷を減らしてください。期限超過カードに取り組む前に、継続負荷だけで1日の上限以上になっています。',
    hardCardOverhead:
      '繰り返し失敗するカードが、セッション時間の大きな割合を占めています。通常レビューとは分けて確認することを検討してください。',
    longReviewTime:
      'まず時間のかかるカードの1日対象数を減らしてください。カード数だけでなく、1回あたりの時間が現在の制約です。',
    currentShrinking:
      '現在の時間上限でもbacklogを減らす余力があります。新しいカードを増やす前に、このペースを安定させてください。',
    fallback:
      '継続的な負荷により、backlogを減らす余力がほとんどありません。負荷を広げる前に、新規カードの停止、時間の追加、または対象範囲の縮小を検討してください。',
  },
  trend: {
    heading: 'backlogの推移',
    description: '日付ごとの記録をローカル保存し、実際の期限超過backlogの変化を確認します。',
    saveToday: '記録を保存',
    updateSnapshot: '記録を更新',
    editSnapshot: '記録を編集',
    cancelEdit: '編集をキャンセル',
    date: '日付',
    overdueBacklog: '今日より前が期限の未処理カード',
    overdueBacklogHelp:
      'prop:due<=-1で見つかるカードを使用してください。今日が期限のカードや赤・緑の表示数が、そのままoverdueになるわけではありません。',
    dueToday: '今日が期限',
    schedulerQueue: 'scheduler queue',
    hardCards: '難しい・leechカード',
    note: 'メモ',
    notePlaceholder: 'この日の状況を任意で記録',
    change: '前回の記録からの変化',
    sevenDayAverage: '7日間の平均backlog',
    trendLabel: '7日間の傾向',
    up: '増加傾向',
    flat: '横ばい',
    down: '減少傾向',
    insufficient: '傾向を表示するには、別の日付の記録を2件以上保存してください。',
    sevenDayInsufficient: '十分なデータが保存されると、7日間の平均を表示します。',
    empty: '保存されたbacklog記録はまだありません。',
    newestFirst: '新しい順',
    saved: '現在のプランに記録を追加しました。',
    updated: '現在のプランで、この日付の既存記録を更新しました。',
    required: 'この項目は必須です。',
    invalidDate: '有効な日付を入力してください。',
    invalidNumber: '有効な数値を入力してください。',
    nonNegative: '0以上の数値を入力してください。',
    wholeNumber: '整数で入力してください。',
    tooLarge: '1,000,000以下で入力してください。',
    duplicateDate: '別の記録が同じ日付を使っています。その記録を編集してください。',
    noteTooLong: 'メモは2,000文字以内にしてください。',
    deleted: '記録を削除しました。',
    contextOnly: '今日が期限のカード、scheduler queue、既知の難しいカード数は参考情報であり、backlogの傾向計算には使いません。',
    actions: '操作',
    edit: '編集',
    delete: '削除',
    sparklineLabel: '今日より前が期限の未処理カードの推移グラフ',
  },
  glossary: {
    heading: 'これらの数値の違い',
    description: 'これらはAnki負荷の異なる部分を表す数値であり、同じものではありません。',
    dueTodayTerm: '今日が期限',
    dueTodayDefinition: '今日が期限として設定されているカード。',
    schedulerQueueTerm: 'Scheduler queue',
    schedulerQueueDefinition:
      '現在のセッションでAnkiが提示しているカード。この数値はレビュー中に変化する場合があります。',
    overdueBacklogTerm: '今日より前が期限の未処理カード',
    overdueBacklogDefinition:
      '今日より前が期限だったのに、まだ未処理のカードです。今日が期限のカードは含めません。',
    usualReviewsTerm: '普段その日に期限を迎えるレビュー数',
    usualReviewsDefinition:
      '別に入力した期限超過カードと、その日に追加する新規カードを除いた、普段の日に期限を迎えるReviewカードです。',
    colorQuestion: 'overdueカードは赤ですか、緑ですか？',
    colorAnswer:
      'どちらの色も、overdueを確実に表すものではありません。Overdueは期限日で決まり、今日より前が期限だったのに未処理のカードを指します。カードの色はqueueや状態を表す場合があり、Ankiの種類やバージョンによって異なることがあります。',
    hardCardsTerm: '難しい・leechカード',
    hardCardsDefinition:
      '何度も失敗する、または通常より大幅に時間がかかるカード。',
  },
  privacy: {
    heading: 'プライバシーと制限事項',
    localHeading: 'ローカルで完結する設計',
    localBody:
      '入力値とsnapshotは、localStorageを使ってこのブラウザにのみ保存されます。アップロードされず、アクセス解析の通信にも含まれません。',
    connectionBody:
      'このツールには、Ankiログイン、ファイルアップロード、backend、AIサービスはありません。本番サイトでは、ページ閲覧数と表示性能の集計にCloudflare Web Analyticsを使用します。計画の入力値、snapshot、メモ、書き出し内容は送信しません。',
    limitationsHeading: '重要な制限事項',
    limitationsBody:
      '表示内容は負荷の概算であり、schedulerの正確な予測ではありません。このバージョンでは、reset、reschedule、forget、bury、filtered deck、FSRS変更、learning/relearning stepsの正確な結果は再現しません。',
    destructiveWarning:
      '大きなscheduling変更を行う前に、Anki公式ドキュメントを確認してください。',
    hardCardsHeading: '難しいカードについて判断できないこと',
    hardCardsCanBody:
      '難しいカードの追加負荷と、対象範囲を縮小した場合の影響は概算できます。',
    hardCardsBody:
      '個々のカードについて、書き直すべきか、例文カードにすべきか、suspendすべきか、客観的に良いか悪いかは判断できません。',
  },
  methodology: {
    heading: '概算の計算方法',
    description: 'すべての結果は決められた式で計算され、このブラウザに入力した値だけを使います。',
    workloadHeading: '1. 毎日の継続負荷',
    workloadBody: '普段その日に期限を迎えるReviewカード、新規カードが生む将来負荷、難しいカードの追加時間を秒へ換算して合計します。普段のレビュー入力はカード数の概算であり、Anki Statsの回答回数ではありません。',
    workloadFormula: '継続負荷 = 普段のレビュー + 新規カード負荷 + 難しいカードの追加負荷',
    directionHeading: '2. backlogの方向',
    directionBody:
      '1日の上限時間から継続負荷を先に引きます。backlogを減らせる上限は、入力した時間内で1学習日に処理できる期限超過カード数の概算です。現在のbacklogがその上限より少ない場合、backlogは0より少なくなることはありません。',
    directionFormula:
      'backlogに使える時間 = 1日の上限時間 − 継続負荷、削減上限 = backlogに使える時間 ÷ 1レビューの秒数',
    onePassHeading: '3. 一巡までの概算',
    onePassBody: '現在の期限超過カードに必要な時間を、1学習日あたりの余力で割ります。正確な復帰日ではありません。',
    onePassFormula: '学習日数の概算 ≈ 期限超過カードの所要時間 ÷ 1日の余力',
    targetHeading: '4. 目標日の実現性',
    targetBody: '休む曜日を除外し、必要な1日時間を入力した上限と比べます。不可能な値を実現可能とは表示しません。',
    targetFormula: '必要時間 = 継続負荷 + 目標達成に必要なbacklogペース',
    contextHeading: '詳細設定には参考情報のみの値があります',
    contextBody: '今日より前が期限の未処理カードは、Anki DesktopのBrowseでprop:due<=-1を検索して確認できます。色付きの表示数だけではoverdueを判定できません。今日が期限のカード、scheduler queue、既知のleech・難しいカード数だけでは推定結果は変わりません。Anki Statsは回答回数を数えるため、同じLearning・Relearningカードが複数回含まれることがあります。現在のqueueを終えても、Anki全体の作業が完了したとは限りません。',
  },
  export: {
    heading: 'ローカルプランを書き出す',
    description: '書き出しファイルはこのブラウザ内で作成され、アップロードされません。',
    copyText: 'プランをテキストでコピー',
    downloadMarkdown: 'プランをMarkdownでダウンロード',
    exportCsv: '記録をCSVで書き出す',
    downloadJson: 'すべてのローカルデータをJSONでダウンロード',
    copied: 'プランをクリップボードにコピーしました。',
    copyFailed: 'プランをコピーできませんでした。Markdownダウンロードをお試しください。',
    noSnapshots: '書き出せる記録がありません。',
    invalidPlan: '強調表示された入力を修正してから、プランをコピーまたはダウンロードしてください。',
    markdownTitle: 'Anki負荷プラン',
    summaryHeading: 'サマリー',
    inputsHeading: '現在の入力',
    inputInterpretationHeading: '入力値の解釈',
    overdueInputRule:
      '今日より前が期限で未処理のカードをoverdueとして扱います。今日が期限のカードや赤・緑の表示数からは推測しません。overdue数はBrowseのCardsモードでprop:due<=-1を使って確認できます。',
    usualReviewsInputRule:
      '普段その日に期限を迎えるReviewカード数の概算として扱います。入力済みの期限超過カードと新規カードを除き、Anki Statsの回答回数はそのまま使用しません。期限超過と普段のReviewは、同じデッキまたはコレクション範囲で見積もります。',
    breakdownHeading: '1日の負荷内訳',
    scenariosHeading: '調整案の比較',
    recommendationHeading: '最初におすすめする調整',
    trendHeading: 'backlogの記録',
    generatedLocally: 'ブラウザ内でローカル生成されました。データはアップロードされていません。',
    hardCardHeading: '難しいカードの負荷',
    usedInEstimate: '推定に使用',
    contextOnly: '参考情報のみ',
    estimatedEffect: '難しいカードの追加負荷がない場合との推定差',
    hardCardNoDailyOverheadCountContext:
      '既知の難しいカード数は参考情報として記録されていますが、1日あたりの難しいカードのレビュー数が0のため、追加負荷は計算に含まれていません。',
    hardCardNoDailyOverhead:
      '計算に使う入力の一方または両方が0のため、難しいカードの追加負荷は計算に含まれていません。',
    backlogDirection: 'backlogの方向',
    currentOverdueBacklog: '今日より前が期限として入力したカード',
  },
  confirm: {
    deleteSnapshotTitle: 'この記録を削除しますか？',
    deleteSnapshotBody: '選択したローカル記録は削除され、元に戻せません。',
    deleteAllTitle: 'すべてのローカルデータを削除しますか？',
    deleteAllBody:
      '保存済みの入力値、言語設定、すべてのbacklog記録がこのブラウザから削除されます。',
    resetPlanTitle: 'プランの入力値をリセットしますか？',
    resetPlanBody: '入力値を初期状態に戻します。保存済みのbacklog記録は残ります。',
    cancel: 'キャンセル',
    confirmDelete: '削除',
    confirmDeleteAll: 'すべてのローカルデータを削除',
    confirmResetPlan: '入力値をリセット',
  },
  localData: {
    heading: 'ローカルデータの管理',
    resetPlan: 'プランをリセット',
    resetPlanHelp: 'backlogの記録を残したまま、入力値を初期値に戻します。',
    deleteAll: 'すべてのローカルデータを削除',
    deleteAllHelp: 'このブラウザから、プラン、backlogの記録、言語設定を削除します。',
    resetDone: 'プランの入力値をリセットしました。',
    deleteDone: 'すべてのローカルデータを削除しました。',
    storageErrorHeading: '変更をローカル保存できませんでした。',
    storageErrorBody: 'この画面では操作を続けられますが、再読み込みすると変更が失われる場合があります。ブラウザの保存権限と空き容量を確認してください。',
  },
  footer: {
    disclaimer:
      'Anki負荷プランナーは、Anki、AnkiWeb、AnkiDroid、AnkiMobileとは無関係です。表示内容は負荷の概算であり、Ankiのschedulerを正確に再現するものではありません。',
  },
  common: {
    minutes: '分',
    minutesShort: '分',
    minutesPerDay: '分/日',
    seconds: '秒',
    secondsShort: '秒',
    cards: '枚',
    cardsPerDay: '枚/日',
    reviews: 'レビュー',
    reviewsPerDay: 'レビュー/日',
    days: '日',
    studyDays: '学習日',
    workingDays: '稼働日',
    units: {
      studyDay: {
        one: '{count}学習日',
        other: '{count}学習日',
      },
      workingDay: {
        one: '{count}稼働日',
        other: '{count}稼働日',
      },
      card: {
        one: '{count}枚',
        other: '{count}枚',
      },
      review: {
        one: '{count}回',
        other: '{count}回',
      },
      cardPerDay: {
        one: '{count}枚/日',
        other: '{count}枚/日',
      },
      reviewPerDay: {
        one: '{count}回/日',
        other: '{count}回/日',
      },
    },
    perDay: '1日あたり',
    notAvailable: '計算できません',
    none: 'なし',
    zero: '0',
    positiveChange: '増加',
    negativeChange: '減少',
    noChange: '変化なし',
    roughEstimate: '概算',
    optional: '任意',
    close: '閉じる',
    yes: 'はい',
    no: 'いいえ',
  },
} as const satisfies Translation
