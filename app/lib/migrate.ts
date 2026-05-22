/**
 * migrate.ts
 *
 * JSONの後方互換マイグレーション。
 * バージョンアップで型が変わった場合はここに migrate_vN_to_vN1() を追加するだけ。
 * importJSON から呼ぶと自動で最新バージョンまで順番に適用される。
 *
 * 現在の最新 schemaVersion: 2
 *
 * バージョン履歴:
 *   v0 (未定義) : schemaVersionフィールドなし。portSideがNodeレベルにあった時代
 *   v1           : schemaVersion=1。portSideがPortレベルになった (v5)
 *   v2           : schemaVersion=2。現在の最新版
 */

import { DiagramData, PortSide } from '../types/diagram';

export const CURRENT_SCHEMA_VERSION = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJSON = Record<string, any>;

// ---- マイグレーション関数 ----

/**
 * v0 → v1
 * 変更点: Node.portSide (string) → 各 Port.side (string)
 * v0はschemaVersionフィールドが存在しない
 */
function migrate_v0_to_v1(data: AnyJSON): AnyJSON {
  return {
    ...data,
    schemaVersion: 1,
    nodes: (data.nodes ?? []).map((node: AnyJSON) => {
      // portSideがNodeレベルにある場合は各ポートに移す
      const defaultSide: PortSide = node.portSide ?? 'right';
      return {
        ...node,
        portSide: undefined, // 削除
        ports: (node.ports ?? []).map((port: AnyJSON) => ({
          ...port,
          side: port.side ?? defaultSide, // すでにsideがあればそのまま
        })),
      };
    }),
  };
}

/**
 * v1 → v2
 * 変更点: 現時点では構造変更なし。将来の拡張のためのプレースホルダー
 * ※ 次にスキーマ変更が入ったらここを実装する
 */
function migrate_v1_to_v2(data: AnyJSON): AnyJSON {
  return {
    ...data,
    schemaVersion: 2,
    // 例: 将来 nodes に新フィールドが追加されたらここでデフォルト値を埋める
    // nodes: data.nodes.map((n: AnyJSON) => ({ zIndex: 0, ...n })),
  };
}

// ---- マイグレーション管理 ----

// バージョンに対応するマイグレーション関数の一覧
// 「vN → vN+1」を順番に定義する
const MIGRATIONS: Array<(data: AnyJSON) => AnyJSON> = [
  migrate_v0_to_v1, // 0 → 1
  migrate_v1_to_v2, // 1 → 2
];

/**
 * 読み込んだJSONを現在のスキーマバージョンまで自動マイグレーション
 */
export function migrateJSON(raw: AnyJSON): DiagramData {
  let data = { ...raw };
  const fromVersion: number = data.schemaVersion ?? 0;

  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new Error(
      `このファイルはより新しいバージョン(v${fromVersion})で作成されています。\nアプリを最新版にアップデートしてください。`
    );
  }

  // fromVersionから順にマイグレーションを適用
  for (let v = fromVersion; v < CURRENT_SCHEMA_VERSION; v++) {
    console.info(`[migrate] v${v} → v${v + 1}`);
    data = MIGRATIONS[v](data);
  }

  return data as DiagramData;
}
