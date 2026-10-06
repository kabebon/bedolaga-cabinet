import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { CheckIcon, XIcon } from '@/components/icons';
import { tariffComparisonApi, type ComparisonCell } from '@/api/tariffComparison';

interface TariffComparisonTableProps {
  /** Тарифы, которые сейчас на экране выбора. Чужие колонки не показываем. */
  tariffIds: number[];
}

function cellKey(cell: ComparisonCell | undefined): string {
  if (!cell || cell.kind === 'empty') return 'empty';
  if (cell.kind === 'text') return `text:${cell.text}`;
  return cell.kind;
}

function CellView({ cell }: { cell: ComparisonCell | undefined }) {
  if (!cell || cell.kind === 'empty') {
    return <span className="text-dark-500">—</span>;
  }
  if (cell.kind === 'yes') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success-500/15 text-success-400">
        <CheckIcon className="h-4 w-4" />
      </span>
    );
  }
  if (cell.kind === 'no') {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-dark-700/80 text-dark-500">
        <XIcon className="h-4 w-4" />
      </span>
    );
  }
  return <span className="font-medium text-dark-100">{cell.text}</span>;
}

/**
 * Витрина отличий тарифов. Факты (трафик, устройства, серверы, цена) и строки
 * +/- приходят с бэкенда; здесь только раскладка по тем тарифам, которые
 * человек сейчас выбирает.
 */
export function TariffComparisonTable({ tariffIds }: TariffComparisonTableProps) {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'ru').split('-')[0];
  const idsKey = tariffIds.join(',');

  const { data } = useQuery({
    queryKey: ['tariff-comparison', lang],
    queryFn: () => tariffComparisonApi.getPublic(lang),
    enabled: tariffIds.length >= 2,
    staleTime: 60_000,
  });

  const view = useMemo(() => {
    if (!data?.enabled) return null;
    const order = new Map(tariffIds.map((id, index) => [id, index]));
    const columns = data.columns
      .filter((column) => order.has(column.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    if (columns.length < 2) return null;
    const visible = new Set(columns.map((column) => String(column.id)));
    const rows = data.rows.map((row) => {
      const cells = columns.map((column) => row.cells[String(column.id)]);
      const distinct = new Set(cells.map((cell) => cellKey(cell)));
      return {
        ...row,
        differs: distinct.size > 1,
        cells: Object.fromEntries(
          Object.entries(row.cells).filter(([tariffId]) => visible.has(tariffId)),
        ),
      };
    });
    return { title: data.title, columns, rows };
  }, [data, idsKey, tariffIds]);

  if (!view) return null;

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-dark-700/80 bg-dark-900/60">
      <div className="border-b border-dark-700/80 px-4 py-3">
        <h2 className="text-sm font-semibold text-dark-100">
          {view.title || t('subscription.comparisonTitle', 'Сравнение тарифов')}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-dark-900 px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-dark-500" />
              {view.columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-3 py-3 text-center font-semibold ${
                    column.is_highlighted ? 'text-warning-300' : 'text-dark-100'
                  }`}
                >
                  {column.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.id} className="border-t border-dark-800">
                <th
                  className={`sticky left-0 z-10 bg-dark-900 px-4 py-3 text-left font-medium ${
                    row.differs ? 'text-dark-100' : 'text-dark-400'
                  }`}
                >
                  {row.label}
                </th>
                {view.columns.map((column) => (
                  <td key={column.id} className="px-3 py-3 text-center align-middle">
                    <div className="flex justify-center">
                      <CellView cell={row.cells[String(column.id)]} />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
