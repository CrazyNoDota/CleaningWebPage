import type { VerificationStatus } from '@/lib/types';

export function CleanerBadges({
  isActive,
  verificationStatus,
}: {
  isActive: boolean;
  verificationStatus: VerificationStatus;
}) {
  return (
    <span className="flex flex-wrap gap-1">
      {isActive ? (
        <span className="badge-green">Активен</span>
      ) : (
        <span className="badge-slate">Заблокирован</span>
      )}
      {verificationStatus === 'verified' && (
        <span className="badge-green">✓ Проверен</span>
      )}
      {verificationStatus === 'pending' && (
        <span className="badge-amber">На проверке</span>
      )}
      {verificationStatus === 'unverified' && (
        <span className="badge-slate">Не проверен</span>
      )}
      {verificationStatus === 'rejected' && (
        <span className="badge-red">Отклонён</span>
      )}
    </span>
  );
}
