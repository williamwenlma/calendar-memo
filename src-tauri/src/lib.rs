use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "create_memos_table",
        sql: "CREATE TABLE IF NOT EXISTS memos (
                id TEXT PRIMARY KEY NOT NULL,
                date TEXT NOT NULL,
                time TEXT,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
              );
              CREATE INDEX IF NOT EXISTS idx_memos_date_time ON memos(date, time);",
        kind: MigrationKind::Up,
    }, Migration {
        version: 2,
        description: "add_memo_priority",
        sql: "ALTER TABLE memos ADD COLUMN priority TEXT CHECK (priority IN (
            'important-urgent', 'important-not-urgent', 'not-important-urgent', 'not-important-not-urgent'
        ));",
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:calendar-memo.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("运行日历便签时发生错误");
}
