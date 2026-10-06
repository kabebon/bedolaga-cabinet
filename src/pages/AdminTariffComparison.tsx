import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  tariffComparisonApi,
  type ComparisonCellKind,
  type ComparisonRow,
} from '@/api/tariffComparison';
import { AdminBackButton, Toggle } from '@/components/admin';
import { useNotify } from '@/platform';
import { getApiErrorMessage } from '@/utils/api-error';

const LANGS = ['ru', 'en', 'ua', 'zh', 'fa'] as const;

function emptyRow(tariffIds: number[]): ComparisonRow {
  return {
    id: `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    labels: { ru: '' },
    cells: Object.fromEntries(tariffIds.map((id) => [String(id), { kind: 'no' as const, text: '' }])),
  };
}

export default function AdminTariffComparison() {
  const { t } = useTranslation();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-tariff-comparison'],
    queryFn: () => tariffComparisonApi.getAdmin(),
  });

  const [enabled, setEnabled] = useState(true);
  const [showAuto, setShowAuto] = useState(true);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!data || loaded) return;
    setEnabled(data.enabled);
    setShowAuto(data.show_auto);
    setRows(data.rows);
    setLoaded(true);
  }, [data, loaded]);

  const save = useMutation({
    mutationFn: () =>
      tariffComparisonApi.saveAdmin({
        enabled,
        show_auto: showAuto,
        rows: rows.filter((row) => (row.labels.ru || '').trim() || Object.values(row.labels).some((v) => v.trim())),
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(['admin-tariff-comparison'], saved);
      queryClient.invalidateQueries({ queryKey: ['tariff-comparison'] });
      setRows(saved.rows);
      notify.success(t('admin.tariffComparison.saved'));
    },
    onError: (error) => {
      notify.error(getApiErrorMessage(error, t('admin.tariffComparison.saveError')));
    },
  });

  const tariffs = data?.tariffs ?? [];

  const updateCell = (rowIndex: number, tariffId: number, kind: ComparisonCellKind, text = '') => {
    setRows((current) =>
      current.map((row, index) => {
        if (index !== rowIndex) return row;
        return {
          ...row,
          cells: {
            ...row.cells,
            [String(tariffId)]: { kind, text: kind === 'text' ? text : '' },
          },
        };
      }),
    );
  };

  const updateLabel = (rowIndex: number, lang: string, value: string) => {
    setRows((current) =>
      current.map((row, index) =>
        index === rowIndex ? { ...row, labels: { ...row.labels, [lang]: value } } : row,
      ),
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <AdminBackButton to="/admin" />
        <div>
          <h1 className="text-xl font-bold text-dark-100">{t('admin.tariffComparison.title')}</h1>
          <p className="text-sm text-dark-400">{t('admin.tariffComparison.subtitle')}</p>
        </div>
      </div>

      {isLoading && <p className="text-sm text-dark-400">{t('common.loading')}</p>}
      {isError && <p className="text-sm text-error-400">{t('common.error')}</p>}

      {data && (
        <>
          <div className="space-y-4 rounded-2xl border border-dark-700 bg-dark-900/60 p-4">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block font-medium text-dark-100">
                  {t('admin.tariffComparison.enabled')}
                </span>
                <span className="block text-sm text-dark-400">
                  {t('admin.tariffComparison.enabledHint')}
                </span>
              </span>
              <Toggle
                checked={enabled}
                aria-label={t('admin.tariffComparison.enabled')}
                onChange={() => setEnabled((value) => !value)}
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="block font-medium text-dark-100">
                  {t('admin.tariffComparison.showAuto')}
                </span>
                <span className="block text-sm text-dark-400">
                  {t('admin.tariffComparison.showAutoHint')}
                </span>
              </span>
              <Toggle
                checked={showAuto}
                aria-label={t('admin.tariffComparison.showAuto')}
                onChange={() => setShowAuto((value) => !value)}
              />
            </label>
          </div>

          {tariffs.length < 2 ? (
            <p className="text-sm text-dark-400">{t('admin.tariffComparison.noTariffs')}</p>
          ) : (
            <div className="space-y-4">
              {rows.map((row, rowIndex) => (
                <div key={row.id} className="rounded-2xl border border-dark-700 bg-dark-900/60 p-4">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                      value={row.labels.ru || ''}
                      onChange={(event) => updateLabel(rowIndex, 'ru', event.target.value)}
                      placeholder={t('admin.tariffComparison.rowLabel')}
                      className="min-w-0 flex-1 rounded-xl border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 outline-none focus:border-accent-500"
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-dark-700 px-3 py-2 text-sm text-dark-300 hover:border-dark-500"
                      onClick={() =>
                        setRows((current) => {
                          if (rowIndex === 0) return current;
                          const next = [...current];
                          const [item] = next.splice(rowIndex, 1);
                          next.splice(rowIndex - 1, 0, item);
                          return next;
                        })
                      }
                    >
                      {t('admin.tariffComparison.moveUp')}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-dark-700 px-3 py-2 text-sm text-dark-300 hover:border-dark-500"
                      onClick={() =>
                        setRows((current) => {
                          if (rowIndex === current.length - 1) return current;
                          const next = [...current];
                          const [item] = next.splice(rowIndex, 1);
                          next.splice(rowIndex + 1, 0, item);
                          return next;
                        })
                      }
                    >
                      {t('admin.tariffComparison.moveDown')}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-error-500/40 px-3 py-2 text-sm text-error-400 hover:bg-error-500/10"
                      onClick={() => setRows((current) => current.filter((_, index) => index !== rowIndex))}
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                  <details className="mb-3 text-sm text-dark-400">
                    <summary className="cursor-pointer">{t('admin.tariffComparison.otherLanguages')}</summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {LANGS.filter((lang) => lang !== 'ru').map((lang) => (
                        <label key={lang} className="flex items-center gap-2">
                          <span className="w-8 uppercase">{lang}</span>
                          <input
                            value={row.labels[lang] || ''}
                            onChange={(event) => updateLabel(rowIndex, lang, event.target.value)}
                            className="min-w-0 flex-1 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-dark-100 outline-none focus:border-accent-500"
                          />
                        </label>
                      ))}
                    </div>
                  </details>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[36rem] text-sm">
                      <thead>
                        <tr>
                          {tariffs.map((tariff) => (
                            <th key={tariff.id} className="px-2 py-2 text-center font-medium text-dark-200">
                              {tariff.name}
                              {!tariff.is_active && (
                                <span className="mt-1 block text-xs font-normal text-dark-500">
                                  {t('admin.tariffComparison.inactive')}
                                </span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {tariffs.map((tariff) => {
                            const cell = row.cells[String(tariff.id)] || { kind: 'empty' as const, text: '' };
                            return (
                              <td key={tariff.id} className="px-2 py-2 align-top">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="flex rounded-lg border border-dark-700 p-0.5">
                                    {(['yes', 'no', 'text'] as const).map((kind) => (
                                      <button
                                        key={kind}
                                        type="button"
                                        onClick={() => updateCell(rowIndex, tariff.id, kind, cell.text)}
                                        className={`rounded-md px-2 py-1 text-xs ${
                                          cell.kind === kind
                                            ? 'bg-accent-500 text-on-accent'
                                            : 'text-dark-300 hover:bg-dark-800'
                                        }`}
                                      >
                                        {t(`admin.tariffComparison.kinds.${kind}`)}
                                      </button>
                                    ))}
                                  </div>
                                  {cell.kind === 'text' && (
                                    <input
                                      value={cell.text}
                                      onChange={(event) =>
                                        updateCell(rowIndex, tariff.id, 'text', event.target.value)
                                      }
                                      placeholder={t('admin.tariffComparison.textPlaceholder')}
                                      className="w-full rounded-lg border border-dark-700 bg-dark-800 px-2 py-1 text-center text-dark-100 outline-none focus:border-accent-500"
                                    />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="rounded-xl border border-dashed border-dark-600 px-4 py-3 text-sm text-dark-200 hover:border-accent-500"
                onClick={() => setRows((current) => [...current, emptyRow(tariffs.map((tariff) => tariff.id))])}
              >
                {t('admin.tariffComparison.addRow')}
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="rounded-xl bg-accent-500 px-5 py-3 font-semibold text-on-accent hover:bg-accent-400 disabled:opacity-60"
          >
            {save.isPending ? t('common.saving') : t('common.save')}
          </button>
        </>
      )}
    </div>
  );
}
