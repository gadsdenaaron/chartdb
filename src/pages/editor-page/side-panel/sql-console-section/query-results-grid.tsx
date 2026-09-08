import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { Spinner } from '@/components/spinner/spinner';
import type { QueryResult } from '@/lib/data-sources/data-source-connector';
import { formatCell } from '@/lib/data-sources/format-query-result';

export const QUERY_RESULT_ROW_LIMIT = 1000;

export interface QueryResultsGridProps {
    result: QueryResult | undefined;
    isLoading: boolean;
    error: string | undefined;
}

export const QueryResultsGrid: React.FC<QueryResultsGridProps> = ({
    result,
    isLoading,
    error,
}) => {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 overflow-auto p-3 text-sm text-red-600 dark:text-red-400">
                {error}
            </div>
        );
    }

    if (!result) {
        return (
            <div className="flex flex-1 items-center justify-center p-3 text-center text-sm text-muted-foreground">
                {t('side_panel.sql_console_section.results.no_results')}
            </div>
        );
    }

    const displayedRows = result.rows.slice(0, QUERY_RESULT_ROW_LIMIT);

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {result.columns.map((column) => (
                                <TableHead key={column.name}>
                                    {column.name}
                                    <span className="ml-1 font-normal text-muted-foreground">
                                        {column.type}
                                    </span>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {displayedRows.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                                {result.columns.map((column) => (
                                    <TableCell key={column.name}>
                                        {formatCell(row[column.name])}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="shrink-0 border-t px-3 py-1.5 text-xs text-muted-foreground">
                {result.rowCount > QUERY_RESULT_ROW_LIMIT
                    ? t(
                          'side_panel.sql_console_section.results.truncated_notice',
                          {
                              shown: QUERY_RESULT_ROW_LIMIT,
                              total: result.rowCount,
                          }
                      )
                    : t('side_panel.sql_console_section.results.row_count', {
                          count: result.rowCount,
                      })}
                {' · '}
                {Math.round(result.durationMs)}ms
            </div>
        </div>
    );
};
