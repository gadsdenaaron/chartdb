import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Upload } from 'lucide-react';
import type { Monaco } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { CodeSnippet } from '@/components/code-snippet/code-snippet';
import { Button } from '@/components/button/button';
import { FileUploader } from '@/components/file-uploader/file-uploader';
import { useDuckDB } from '@/hooks/use-duckdb';
import { useDataSources } from '@/hooks/use-data-sources';
import type { LocalFileConnectionInfo } from '@/lib/data-sources/connectors/local-file-connector';
import { arrowResultToQueryResult } from '@/lib/data-sources/format-query-result';
import type { QueryResult } from '@/lib/data-sources/data-source-connector';
import { generateId } from '@/lib/utils';
import { QueryResultsGrid } from './query-results-grid';

const escapeSqlString = (value: string) => value.replace(/'/g, "''");
const escapeSqlIdentifier = (value: string) => value.replace(/"/g, '""');

const toViewName = (fileName: string, fallbackIndex: number): string => {
    const withoutExtension = fileName.replace(/\.[^./]+$/, '');
    const sanitized = withoutExtension
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .replace(/^(\d)/, '_$1');
    return sanitized || `dataset_${fallbackIndex}`;
};

const DEFAULT_QUERY = 'SELECT 42 AS answer;';

interface RegisteredFile {
    config: LocalFileConnectionInfo;
    viewName: string;
}

export interface SQLConsoleSectionProps {}

export const SQLConsoleSection: React.FC<SQLConsoleSectionProps> = () => {
    const { t } = useTranslation();
    const { ensureInitialized, getConnection } = useDuckDB();
    const { registry, connections, addConnection, removeConnection } =
        useDataSources();

    const [files, setFiles] = useState<File[]>([]);
    const [showUploader, setShowUploader] = useState(false);
    const [uploadError, setUploadError] = useState<string | undefined>();

    const [sqlText, setSqlText] = useState(DEFAULT_QUERY);
    const [result, setResult] = useState<QueryResult | undefined>();
    const [isRunning, setIsRunning] = useState(false);
    const [runError, setRunError] = useState<string | undefined>();

    const prevFilesRef = useRef<File[]>([]);
    const registeredFilesRef = useRef<Map<File, RegisteredFile>>(new Map());

    const registerFile = useCallback(
        async (file: File) => {
            const connector = registry.get('localFile');
            if (!connector) return;

            const db = await ensureInitialized();
            const conn = await getConnection();

            const config: LocalFileConnectionInfo = {
                id: generateId(),
                kind: 'localFile',
                name: file.name,
                authStrategy: { kind: 'none' },
                file,
                registeredFileName: file.name,
            };

            try {
                await connector.registerSource(db, conn, config);

                const viewName = toViewName(
                    file.name,
                    registeredFilesRef.current.size
                );
                const reader = file.name.toLowerCase().endsWith('.parquet')
                    ? 'read_parquet'
                    : 'read_csv_auto';

                await conn.query(
                    `CREATE OR REPLACE VIEW "${escapeSqlIdentifier(viewName)}" AS SELECT * FROM ${reader}('${escapeSqlString(file.name)}')`
                );

                registeredFilesRef.current.set(file, { config, viewName });
                addConnection(config);
                setUploadError(undefined);
            } catch (err) {
                setUploadError(
                    err instanceof Error ? err.message : String(err)
                );
            }
        },
        [registry, ensureInitialized, getConnection, addConnection]
    );

    const unregisterFile = useCallback(
        async (file: File) => {
            const entry = registeredFilesRef.current.get(file);
            if (!entry) return;
            registeredFilesRef.current.delete(file);

            try {
                const conn = await getConnection();
                await conn.query(
                    `DROP VIEW IF EXISTS "${escapeSqlIdentifier(entry.viewName)}"`
                );
                const connector = registry.get('localFile');
                await connector?.unregisterSource?.(conn, entry.config);
            } catch {
                // best-effort teardown; nothing actionable to surface here
            }

            removeConnection(entry.config.id);
        },
        [getConnection, registry, removeConnection]
    );

    useEffect(() => {
        const prevFiles = prevFilesRef.current;
        const addedFiles = files.filter((file) => !prevFiles.includes(file));
        const removedFiles = prevFiles.filter((file) => !files.includes(file));
        prevFilesRef.current = files;

        if (addedFiles.length === 0 && removedFiles.length === 0) {
            return;
        }

        removedFiles.forEach((file) => {
            void unregisterFile(file);
        });
        addedFiles.forEach((file) => {
            void registerFile(file);
        });
    }, [files, registerFile, unregisterFile]);

    const runQuery = useCallback(async () => {
        if (!sqlText.trim()) return;

        setIsRunning(true);
        setRunError(undefined);

        try {
            const conn = await getConnection();
            const start = performance.now();
            const arrowResult = await conn.query(sqlText);
            setResult(
                arrowResultToQueryResult(arrowResult, performance.now() - start)
            );
        } catch (err) {
            setResult(undefined);
            setRunError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsRunning(false);
        }
    }, [sqlText, getConnection]);

    const runQueryRef = useRef(runQuery);
    useEffect(() => {
        runQueryRef.current = runQuery;
    }, [runQuery]);

    const handleEditorMount = useCallback(
        (
            editor: monaco.editor.IStandaloneCodeEditor,
            monacoInstance: Monaco
        ) => {
            editor.addCommand(
                monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
                () => {
                    runQueryRef.current();
                }
            );
        },
        []
    );

    return (
        <section className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b px-3 py-2">
                <span className="text-sm font-medium">
                    {t('side_panel.sql_console_section.title')}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUploader((prev) => !prev)}
                >
                    <Upload className="mr-1 size-3.5" />
                    {t('side_panel.sql_console_section.upload_files')}
                </Button>
            </div>

            {showUploader ? (
                <div className="border-b p-3">
                    <FileUploader
                        onFilesChange={setFiles}
                        multiple
                        supportedExtensions={['.csv', '.parquet']}
                    />
                    {uploadError ? (
                        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                            {uploadError}
                        </p>
                    ) : null}
                </div>
            ) : null}

            {connections.length > 0 ? (
                <div className="flex flex-wrap gap-1 border-b px-3 py-2">
                    {connections.map((connection) => (
                        <span
                            key={connection.id}
                            className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                            {connection.name}
                        </span>
                    ))}
                </div>
            ) : null}

            <div className="flex flex-1 flex-col gap-2 overflow-hidden p-3">
                <CodeSnippet
                    className="h-40 shrink-0"
                    code={sqlText}
                    language="sql"
                    allowCopy={false}
                    actions={[
                        {
                            label: t('side_panel.sql_console_section.run'),
                            icon: Play,
                            onClick: runQuery,
                        },
                    ]}
                    editorProps={{
                        onMount: handleEditorMount,
                        onChange: (value) => setSqlText(value ?? ''),
                        options: { readOnly: false },
                    }}
                />
                <div className="shrink-0 text-xs text-muted-foreground">
                    {t('side_panel.sql_console_section.run_shortcut_hint')}
                </div>
                <QueryResultsGrid
                    result={result}
                    isLoading={isRunning}
                    error={runError}
                />
            </div>
        </section>
    );
};
