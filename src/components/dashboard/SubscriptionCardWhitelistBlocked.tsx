import { uiLocale } from '@/utils/uiLocale';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import type { UseMutationResult } from '@tanstack/react-query';
import TrafficProgressBar from './TrafficProgressBar';
import { useTheme } from '../../hooks/useTheme';
import { formatTraffic } from '../../utils/formatTraffic';
import { getGlassColors } from '../../utils/glassTheme';
import { HoverBorderGradient } from '../ui/hover-border-gradient';
import {
  CalendarIcon,
  RefreshIcon,
  CloudWarningIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@/components/icons';
import { useHaptic } from '../../platform';
import type { Subscription } from '../../types';

interface SubscriptionCardWhitelistBlockedProps {
  subscription: Subscription;
  refreshTrafficMutation: UseMutationResult<unknown, unknown, void, unknown>;
  trafficRefreshCooldown: number;
  connectedDevices: number;
}

/**
 * Карточка для состояния «whitelist (премиум-серверы) исчерпан».
 *
 * Traffic-limiter снял whitelist squad — подписка остаётся активной на basic,
 * но премиум недоступен. Показываем две зоны: Премиум 🔴 (100/100) и Обычные 🟢 (∞).
 * Чисто дисплеевая карточка — не влияет на продление/баланс/докупку.
 */
export default function SubscriptionCardWhitelistBlocked({
  subscription,
  refreshTrafficMutation,
  trafficRefreshCooldown,
  connectedDevices,
}: SubscriptionCardWhitelistBlockedProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const g = getGlassColors(isDark);
  const haptic = useHaptic();

  // Премиум-зона: лимит исчерпан → 100%
  const premiumUsedGb = subscription.traffic_limit_gb;
  const premiumLimitGb = subscription.traffic_limit_gb;
  const premiumPercent = 100;

  const formattedDate = new Date(subscription.end_date).toLocaleDateString(uiLocale());
  const daysLeft = subscription.days_left;

  const isAtDeviceLimit =
    subscription.device_limit > 0 && connectedDevices >= subscription.device_limit;

  return (
    <div
      className="relative overflow-hidden rounded-3xl lg:backdrop-blur-xl"
      style={{
        background: g.cardBg,
        border: isDark
          ? `1px solid ${g.cardBorder}`
          : '1px solid rgba(var(--color-warning-400), 0.18)',
        padding: '28px 28px 24px',
        boxShadow: isDark
          ? g.shadow
          : '0 2px 16px rgba(var(--color-warning-400), 0.08), 0 0 0 1px rgba(var(--color-warning-400), 0.04)',
      }}
    >
      {/* ─── Header ─── */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: 'rgb(var(--color-warning-400))' }}
              aria-hidden="true"
            />
            <span
              className="font-mono text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgb(var(--color-warning-400))' }}
            >
              {t('dashboard.whitelistExhausted', 'Белые списки исчерпаны')}
            </span>
            {subscription.is_trial && (
              <span className="inline-flex items-center gap-1 rounded-md border border-accent-400/25 bg-accent-400/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent-400">
                {t('subscription.trialStatus')}
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold tracking-tight text-dark-50">
            {subscription.tariff_name || t('subscription.currentPlan')}
          </h2>
          <div className="mt-0.5 font-mono text-[11px] text-dark-50/40">
            {t('dashboard.active', 'Активна')}
          </div>
        </div>
      </div>

      {/* ─── Две зоны: Премиум / Обычные ─── */}
      <div className="mb-5 grid grid-cols-2 gap-2.5">
        {/* Премиум-зона: исчерпан 🔴 */}
        <div
          className="rounded-[14px] p-3.5"
          style={{
            background: 'rgba(var(--color-warning-400), 0.06)',
            border: '1px solid rgba(var(--color-warning-400), 0.18)',
          }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <CloudWarningIcon className="h-3.5 w-3.5 text-warning-400" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-warning-400">
              {t('dashboard.premiumZone', 'Премиум')}
            </span>
          </div>
          <div className="mb-1 text-[11px] font-medium text-dark-50/50">
            {t('dashboard.premiumDisabled', 'Исчерпаны')}
          </div>
          <div className="font-mono text-[11px] text-dark-50/40">
            {formatTraffic(premiumUsedGb)} / {formatTraffic(premiumLimitGb)}
          </div>
          <div className="mt-2">
            <TrafficProgressBar
              usedGb={premiumUsedGb}
              limitGb={premiumLimitGb}
              percent={premiumPercent}
              isUnlimited={false}
              compact
            />
          </div>
        </div>

        {/* Обычные-зона: работают 🟢 */}
        <div
          className="rounded-[14px] p-3.5"
          style={{
            background: 'rgba(var(--color-accent-400), 0.05)',
            border: '1px solid rgba(var(--color-accent-400), 0.16)',
          }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <span style={{ color: 'rgb(var(--color-accent-400))' }}>
              <CheckCircleIcon className="h-3.5 w-3.5" />
            </span>
            <span
              className="font-mono text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'rgb(var(--color-accent-400))' }}
            >
              {t('dashboard.basicZone', 'Обычные')}
            </span>
          </div>
          <div className="mb-1 text-[11px] font-medium text-dark-50/50">
            {t('dashboard.basicActive', 'Работают')}
          </div>
          <div
            className="font-display text-[22px] font-extrabold leading-none tracking-tight"
            style={{ color: 'rgb(var(--color-accent-400))' }}
          >
            &#8734;
          </div>
        </div>
      </div>

      {/* ─── Описание ─── */}
      <div
        className="mb-5 rounded-[12px] p-3 text-[12px] leading-relaxed text-dark-50/55"
        style={{ background: g.innerBg, border: `1px solid ${g.innerBorder}` }}
      >
        {t(
          'subscription.whitelistBlockedDescription',
          'Трафик по белым спискам исчерпан. Докупите трафик, чтобы вернуть белый список. Обычные сервера доступны.',
        )}
      </div>

      {/* ─── Connect Device Button ─── */}
      {subscription.subscription_url && (
        <HoverBorderGradient
          as="button"
          accentColor="rgb(var(--color-accent-400))"
          disabled={isAtDeviceLimit}
          onClick={() => {
            if (isAtDeviceLimit) {
              haptic.notification('error');
              return;
            }
            navigate(`/connection?sub=${subscription.id}`);
          }}
          className={`mb-2.5 flex w-full items-center gap-3.5 rounded-[14px] p-3.5 text-left transition-shadow duration-300${
            isAtDeviceLimit ? 'cursor-not-allowed opacity-50' : ''
          }`}
          style={{ fontFamily: 'inherit' }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px]"
            style={{ background: 'rgba(var(--color-accent-400), 0.07)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgb(var(--color-accent-400))"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M12 17v4M8 21h8" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold tracking-tight text-dark-50">
              {t('dashboard.connectDevice')}
            </div>
            <div className="mt-0.5 text-[11px] text-dark-50/40">
              {t('dashboard.devicesOfMax', {
                used: connectedDevices,
                max: subscription.device_limit,
              })}
            </div>
          </div>
        </HoverBorderGradient>
      )}

      {/* ─── Buy traffic CTA ─── */}
      <button
        onClick={() => {
          haptic.notification('success');
          navigate(`/subscriptions/${subscription.id}`);
        }}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-semibold text-on-accent transition-colors"
        style={{ background: 'rgb(var(--color-accent-400))' }}
      >
        <PlusIcon className="h-4 w-4" />
        {t('subscription.buyPremiumTraffic', 'Докупить трафик для белых списков')}
      </button>

      {/* ─── Stats row: Tariff + Days Left ─── */}
      <div className="mb-5 flex gap-2.5">
        <Link
          to={`/subscriptions/${subscription.id}`}
          className="flex-1 rounded-[14px] p-3.5 transition-colors"
          style={{ background: g.innerBg, border: `1px solid ${g.innerBorder}` }}
        >
          <div
            className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: g.textFaint }}
          >
            {t('dashboard.tariff')}
          </div>
          <div className="min-w-0 truncate text-base font-bold leading-tight tracking-tight text-dark-50">
            {subscription.tariff_name || t('subscription.currentPlan')}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-dark-50/40">
            {t('dashboard.validUntil', { date: formattedDate })}
          </div>
        </Link>
        <div
          className="flex-1 rounded-[14px] p-3.5 transition-colors duration-300"
          style={{
            background: g.innerBg,
            border:
              daysLeft <= 3
                ? '1px solid rgba(var(--color-warning-400), 0.2)'
                : `1px solid ${g.innerBorder}`,
          }}
        >
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-dark-50/40">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-[7px]"
              style={{
                background: daysLeft <= 3 ? 'rgba(var(--color-warning-400), 0.1)' : g.hoverBg,
              }}
            >
              <span
                style={{ color: daysLeft <= 3 ? 'rgb(var(--color-warning-400))' : g.textSecondary }}
              >
                <CalendarIcon className="h-[13px] w-[13px]" />
              </span>
            </div>
            {t('dashboard.remaining')}
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-[22px] font-bold tracking-tight"
              style={{ color: daysLeft <= 3 ? 'rgb(var(--color-warning-400))' : g.text }}
            >
              {daysLeft}
            </span>
            <span className="text-xs font-medium text-dark-50/30">
              {t('subscription.daysShort')}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Traffic Refresh ─── */}
      <div className="flex items-center justify-between px-0.5">
        <button
          onClick={() => refreshTrafficMutation.mutate()}
          disabled={refreshTrafficMutation.isPending || trafficRefreshCooldown > 0}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-dark-50/40 transition-colors hover:bg-dark-50/[0.05] hover:text-dark-50/55 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t('common.refresh')}
        >
          <RefreshIcon
            className={`h-3 w-3 ${refreshTrafficMutation.isPending ? 'animate-spin' : ''}`}
          />
          {trafficRefreshCooldown > 0 ? `${trafficRefreshCooldown}s` : t('common.refresh')}
        </button>
        <Link
          to={`/subscriptions/${subscription.id}`}
          className="text-[11px] font-medium text-dark-50/30 transition-colors hover:text-dark-50/45"
        >
          {t('dashboard.viewSubscription')} &rarr;
        </Link>
      </div>
    </div>
  );
}
