# SHK — 筋骨神経データベース 技術リファレンス

## 概要
人体の筋・骨・神経・関節・靱帯・皮膚の解剖学データをグラフネットワークとして可視化するWebアプリ。
Cytoscape.jsによるインタラクティブグラフで、要素間の関係（起始・停止・神経支配・関節結合・靱帯付着・感覚支配）を探索できる。

## URL
- **本番**: `https://mizuking796.github.io/SHK/`（**更新時はgit pushまで実施**）
- **GitHub**: `mizuking796/SHK`（public）
- **ソース**: `/Users/mizukishirai/claude/services/SHK/`

## ファイル構成
```
SHK/
├── index.html          — HTML（ヘッダー/サイドバー/グラフ/詳細パネル/モーダル）
├── favicon.svg         — ファビコン（SVG）
├── css/
│   └── style.css       — 全CSS（カラー変数/レイアウト/バッジ/レスポンシブ）456行
├── js/
│   ├── data.js         — データユーティリティ（定義マスタ/整合性バリデーション）126行
│   ├── graph.js        — Cytoscape.jsグラフ管理（スタイル/レイアウト/操作）634行
│   └── app.js          — アプリケーションコントローラ（データ読込/検索/詳細表示/逆引き）758行
├── data/
│   ├── muscles.json    — 筋データ 222件（9,625行）
│   ├── bones.json      — 骨・軟部組織データ 145件（1,836行）
│   ├── nerves.json     — 神経データ 77件（1,087行）
│   ├── joints.json     — 関節データ 36件（675行）
│   ├── ligaments.json  — 靱帯データ 42件（653行）
│   └── skin.json       — 皮膚データ 27件（327行）
└── REFERENCE.md        — 本ファイル
```

## 技術スタック
- 静的HTML/CSS/JS（フレームワーク不使用、ビルドステップなし）
- **Cytoscape.js v3.28.1**（CDN: cdnjs.cloudflare.com）— グラフ可視化ライブラリ
- **GitHub Pages**（mainブランチ直接配信）
- フォント: system-ui + Hiragino Sans + Noto Sans JP

## データ規模
- **ノード合計: 549件**（筋222 + 骨138 + 組織7 + 神経77 + 関節36 + 靱帯42 + 皮膚27）
- **エッジ合計: 1,111本**（起始352 + 停止291 + 神経支配245 + 関節結合108 + 靱帯付着87 + 感覚支配28）

### 部位別内訳
| 部位 | 筋 | 骨 | 組織 | 神経 | 関節 | 靱帯 | 皮膚 | 計 |
|------|----|----|------|------|------|------|------|----|
| 頭頸部 | 71 | 31 | 4 | 27 | 4 | 4 | 4 | 145 |
| 上肢 | 49 | 35 | 1 | 21 | 15 | 11 | 7 | 139 |
| 下肢 | 55 | 33 | 0 | 21 | 10 | 17 | 11 | 147 |
| 体幹 | 18 | 33 | 1 | 5 | 4 | 1 | 3 | 65 |
| 背部 | 21 | 1 | 0 | 1 | — | 5 | 1 | 29 |
| 骨盤 | 8 | 5 | 1 | 2 | 3 | 4 | 1 | 24 |

## ノードタイプ
| タイプ | 形状 | 色 | CSSクラス |
|--------|------|----|-----------|
| 筋 muscle | 楕円 ellipse | #c47878 | `.node-badge.muscle` |
| 骨 bone | 角丸四角 round-rectangle | #8a9aa6 | `.node-badge.bone` |
| 神経 nerve | ダイヤ diamond | #b89a30 | `.node-badge.nerve` |
| 関節 joint | 六角 hexagon | #5da578 | `.node-badge.joint` |
| 靱帯 ligament | 角丸三角 round-triangle | #5a9aab | `.node-badge.ligament` |
| 軟部組織 soft_tissue | 樽型 barrel | #b0967e | `.node-badge.soft-tissue` |
| 皮膚 skin | 角丸五角 round-pentagon | #9b7cb5 | `.node-badge.skin` |

## エッジタイプ
| タイプ | スタイル | 色 | 方向 |
|--------|----------|----|------|
| 起始 origin | 実線+矢印 | #b88040 | 筋→骨 |
| 停止 insertion | 実線+矢印 | #5a8ab5 | 筋→骨 |
| 神経支配 innervation | 破線 `[4,3]` | #b89a30 | 神経→筋 |
| 関節結合 articulation | 太実線 | #5da578 | 関節⇔骨 |
| 靱帯付着 ligament_attach | 点線 | #5a9aab | 靱帯→骨 |
| 感覚支配 sensory_innervation | 破線+菱形矢印 `[6,4]` | #9b7cb5 | 神経→皮膚 |

## データスキーマ

### muscles.json
```json
{
  "id": "m_xxx",
  "name_ja": "筋名",
  "name_en": "Muscle name",
  "name_latin": "Musculus xxx",
  "region": "upper_limb",
  "description": "解説テキスト",
  "trivia": "豆知識テキスト",
  "origins": [{ "bone": "b_xxx", "landmark": "部位名" }],
  "insertions": [{ "bone": "b_xxx", "landmark": "部位名" }],
  "innervation": [{ "nerve": "n_xxx", "levels": ["C5","C6"] }],
  "actions": [{ "joint": "j_xxx", "motion": "flexion", "role": "prime|assist" }]
}
```

### bones.json
```json
{
  "id": "b_xxx",
  "name_ja": "骨名",
  "name_en": "Bone name",
  "region": "upper_limb",
  "structure_type": "soft_tissue",
  "description": "解説テキスト",
  "trivia": "豆知識テキスト",
  "landmarks": ["ランドマーク名"]
}
```
※ `structure_type` は軟部組織ノード（皮膚・眼球・舌・帽状腱膜・中心腱・会陰体等）のみ `"soft_tissue"` を指定。省略時は骨として扱われる。

### nerves.json
```json
{
  "id": "n_xxx",
  "name_ja": "神経名",
  "name_en": "Nerve name",
  "region": "upper_limb",
  "description": "解説テキスト",
  "trivia": "豆知識テキスト",
  "root_levels": ["C5","C6"],
  "parent": "n_parent_id"
}
```

### joints.json
```json
{
  "id": "j_xxx",
  "name_ja": "関節名",
  "name_en": "Joint name",
  "region": "upper_limb",
  "type": "hinge",
  "description": "解説テキスト",
  "trivia": "豆知識テキスト",
  "bones": ["b_xxx", "b_yyy"]
}
```

### ligaments.json
```json
{
  "id": "lg_xxx",
  "name_ja": "靱帯名",
  "name_en": "Ligament name",
  "region": "lower_limb",
  "description": "解説テキスト",
  "trivia": "豆知識テキスト",
  "bones": ["b_xxx", "b_yyy"],
  "joints": ["j_xxx"]
}
```

### skin.json
```json
{
  "id": "skin_xxx",
  "name_ja": "皮膚領域名",
  "name_en": "Skin region name",
  "region": "upper_limb",
  "description": "解説テキスト",
  "trivia": "豆知識テキスト",
  "area": "支配領域の説明",
  "nerves": ["n_xxx"]
}
```

## アーキテクチャ（3モジュール構成）

### SHKData（data.js）
- **motionTypes**: 運動タイプ定義 30種（日英）
- **regions**: 部位定義 6種（頭頸部/上肢/下肢/体幹/背部/骨盤）
- **jointTypes**: 関節種類定義 8種
- **validate()**: 全JSONの参照整合性チェック（筋→骨/神経/関節、関節→骨、皮膚→神経、靱帯→骨/関節）

### SHKGraph（graph.js）
- **init(container)**: Cytoscape.jsインスタンス生成。ノードクリック→詳細表示
- **loadData(muscles, bones, nerves, joints, skin, ligaments)**: 6種のJSONからノード+エッジを生成
- **runClusterLayout()**: Olympic-rings式クラスターレイアウト（部位別に解剖学的配置）
  - レイヤー構造: 骨+組織(中心) → 関節 → 靱帯 → 筋 → 神経 → 皮膚(最外)
  - 部位配置: 頭頸部(上) / 上肢(左) / 体幹+背部(中央) / 下肢(下) / 骨盤(右)
- **selectNode(node)**: フォーカス（非接続ノードをフェード）
- **applyFilters(filters)**: ノード/エッジタイプ・部位でフィルタリング

### SHKApp（app.js）
- **loadData()**: 6 JSON fetch → Map構築（muscleMap, boneMap, nerveMap, jointMap, skinMap, ligamentMap）
- **buildSearchIndex()**: 全549件のインクリメンタルサーチ用インデックス（日英ラテン名）
- **showDetail(nodeData)**: ノード種別に応じた詳細パネル描画
  - 筋: 起始/停止/作用/神経支配 + 豆知識
  - 骨/組織: ランドマーク/関節/靱帯/起始する筋/停止する筋
  - 神経: 神経根/親神経/分枝/支配筋/感覚支配域
  - 関節: 種類/構成骨/靱帯/運動と筋（主動筋●/補助筋○）
  - 靱帯: 付着骨/関連関節
  - 皮膚: 支配領域/支配神経
- **逆引きモーダル**: 脊髄レベル→筋 / 運動→筋 / 神経→支配筋

## UI操作
- **検索**: ヘッダー入力欄（日本語/英語/ラテン語。キーボード `/` でフォーカス）
- **フィルタ**: 左サイドバー（ノードタイプ7種 + エッジタイプ6種 + 部位6種）
- **逆引き**: 左サイドバーのボタン3種（脊髄レベル/運動/神経）
- **レイアウト**: クラスター（デフォルト）/ 同心円 / グリッド
- **ズーム**: +/−ボタン or マウスホイール。⊡で全体表示
- **ノード選択**: クリックで詳細パネル表示 + 関連ノードハイライト
- **キーボード**: `/` 検索、`Esc` 閉じる
- **モバイル**: 左上ハンバーガーメニューでサイドバーをドロワー表示（オーバーレイタップで閉じる）

## データ品質
- Claudeのトレーニングデータ（解剖学教科書等）から生成
- **5ラウンドのハルシネーションチェック**で計58件のエラーを修正
  - R1: 32件、R2: 19件、R3: 4件、R4: 3件、R5: 0件（収束確認）
  - 検証手法: 6並列エージェントがWikipedia/Kenhub/StatPearls等で全エントリを照合
  - 参照整合性バリデーション: 全ラウンドでOK確認
- **起始停止監査（2次）**: 軟部組織ノード追加＋61件の起始停止修正＋可視化分離

## 新タイプ追加手順
1. `data/xxx.json` — 新JSONデータファイル作成
2. `js/graph.js` — `colors` にカラー追加 / ノードスタイル追加 / エッジスタイル追加 / `loadData()` でノード+エッジ生成 / レイアウトレイヤー追加 / `applyFilters` / `getStats`
3. `js/app.js` — `data` オブジェクトに追加 / `loadData()` で fetch+Map / `buildSearchIndex()` / `showDetail()` に case追加 / `renderXxxDetail()` 関数追加 / 既存詳細パネルに逆参照セクション追加 / `getTypeColor/Bg/Label` / `updateStats`
4. `js/data.js` — `validate()` に参照チェック追加
5. `index.html` — フィルタチェックボックス追加
6. `css/style.css` — CSS変数 + バッジスタイル追加

## 開発者
特定非営利活動法人リハビリコラボレーション
