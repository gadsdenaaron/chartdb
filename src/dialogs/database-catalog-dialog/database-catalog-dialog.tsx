import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/button/button';
import { DiagramIcon } from '@/components/diagram-icon/diagram-icon';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogInternalContent,
    DialogTitle,
} from '@/components/dialog/dialog';
import { Spinner } from '@/components/spinner/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { useDialog } from '@/hooks/use-dialog';
import { useConfig } from '@/hooks/use-config';
import { useStorage } from '@/hooks/use-storage';
import type { DatabaseCatalogEntry } from '@/lib/data/database-catalog';
import { fetchDatabaseCatalog } from '@/lib/data/database-catalog';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { BaseDialogProps } from '../common/base-dialog-props';

export interface DatabaseCatalogDialogProps extends BaseDialogProps {
    canClose?: boolean;
}

export const DatabaseCatalogDialog: React.FC<DatabaseCatalogDialogProps> = ({
    dialog,
    canClose = true,
}) => {
    const { closeDatabaseCatalogDialog, openCreateDiagramDialog } = useDialog();
    const { t } = useTranslation();
    const { updateConfig } = useConfig();
    const { addDiagram } = useStorage();
    const navigate = useNavigate();
    const [entries, setEntries] = useState<DatabaseCatalogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingFile, setLoadingFile] = useState<string | undefined>();
    const [selectedFile, setSelectedFile] = useState<string | undefined>();

    useEffect(() => {
        if (!dialog.open) {
            return;
        }
        setSelectedFile(undefined);
        setLoading(true);
        fetchDatabaseCatalog()
            .then(setEntries)
            .finally(() => setLoading(false));
    }, [dialog.open]);

    const loadEntry = useCallback(
        async (entry: DatabaseCatalogEntry) => {
            if (loadingFile) {
                return;
            }
            setLoadingFile(entry.file);
            await addDiagram({ diagram: entry.diagram });
            await updateConfig({
                config: { defaultDiagramId: entry.diagram.id },
            });
            navigate(`/diagrams/${entry.diagram.id}`);
            closeDatabaseCatalogDialog();
        },
        [
            addDiagram,
            updateConfig,
            navigate,
            closeDatabaseCatalogDialog,
            loadingFile,
        ]
    );

    return (
        <Dialog
            {...dialog}
            onOpenChange={(open) => {
                if (!open && canClose) {
                    closeDatabaseCatalogDialog();
                }
            }}
        >
            <DialogContent
                className="flex h-[30rem] max-h-screen flex-col overflow-y-auto md:min-w-[80vw] xl:min-w-[55vw]"
                showClose={canClose}
            >
                <DialogHeader>
                    <DialogTitle>
                        {t('database_catalog_dialog.title')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('database_catalog_dialog.description')}
                    </DialogDescription>
                </DialogHeader>
                <DialogInternalContent>
                    {loading ? (
                        <div className="flex flex-1 items-center justify-center py-10">
                            <Spinner size="large" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center py-10 text-sm text-muted-foreground">
                            {t('database_catalog_dialog.empty')}
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-center">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background">
                                    <TableRow>
                                        <TableHead />
                                        <TableHead>
                                            {t(
                                                'database_catalog_dialog.table_columns.name'
                                            )}
                                        </TableHead>
                                        <TableHead className="text-center">
                                            {t(
                                                'database_catalog_dialog.table_columns.tables_count'
                                            )}
                                        </TableHead>
                                        <TableHead />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {entries.map((entry) => (
                                        <TableRow
                                            key={entry.file}
                                            data-state={`${selectedFile === entry.file ? 'selected' : ''}`}
                                            tabIndex={0}
                                            className="cursor-pointer focus:bg-accent focus:outline-none"
                                            onClick={() =>
                                                setSelectedFile(entry.file)
                                            }
                                            onDoubleClick={() =>
                                                loadEntry(entry)
                                            }
                                        >
                                            <TableCell className="table-cell">
                                                <div className="flex justify-center">
                                                    <DiagramIcon
                                                        databaseType={
                                                            entry.diagram
                                                                .databaseType
                                                        }
                                                        databaseEdition={
                                                            entry.diagram
                                                                .databaseEdition
                                                        }
                                                    />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {entry.diagram.name}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {entry.diagram.tables?.length ??
                                                    0}
                                            </TableCell>
                                            <TableCell className="items-center p-0 pr-1 text-right">
                                                {loadingFile === entry.file ? (
                                                    <Spinner className="size-5" />
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogInternalContent>

                <DialogFooter className="flex !justify-between gap-2">
                    {canClose ? (
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                {t('database_catalog_dialog.cancel')}
                            </Button>
                        </DialogClose>
                    ) : (
                        <div />
                    )}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                closeDatabaseCatalogDialog();
                                openCreateDiagramDialog();
                            }}
                        >
                            {t('database_catalog_dialog.new_database')}
                        </Button>
                        <Button
                            type="button"
                            disabled={
                                !selectedFile || loadingFile !== undefined
                            }
                            onClick={() => {
                                const entry = entries.find(
                                    (e) => e.file === selectedFile
                                );
                                if (entry) {
                                    loadEntry(entry);
                                }
                            }}
                        >
                            {t('database_catalog_dialog.open')}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
