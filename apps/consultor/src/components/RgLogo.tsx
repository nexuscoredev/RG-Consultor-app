import { RgMark } from '@/components/RgMark';

type Variant = 'wordmark' | 'compact' | 'sidebar' | 'hero';

type Props = {
  variant?: Variant;
  subtitle?: string;
  className?: string;
};

const APP_NAME = 'consultor';

export function RgLogo({ variant = 'wordmark', subtitle, className = '' }: Props) {
  if (variant === 'hero') {
    return (
      <div className={`rg-logo rg-logo--hero ${className}`.trim()} aria-label="RG consultor">
        <RgMark size="xl" tone="light" />
        {subtitle ? <p className="rg-logo__sub rg-logo__sub--center">{subtitle}</p> : null}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`rg-logo rg-logo--compact ${className}`.trim()} aria-label="RG consultor">
        <RgMark size="sm" />
        <div className="rg-logo__text">
          <span className="rg-logo__product">{APP_NAME}</span>
          {subtitle ? <span className="rg-logo__sub">{subtitle}</span> : null}
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`rg-logo rg-logo--sidebar ${className}`.trim()} aria-label="RG consultor">
        <RgMark size="md" />
        <span className="rg-logo__product rg-logo__product--sidebar">{APP_NAME}</span>
        {subtitle ? <span className="rg-logo__sub">{subtitle}</span> : null}
      </div>
    );
  }

  return (
    <div className={`rg-logo rg-logo--wordmark ${className}`.trim()} aria-label="RG consultor">
      <RgMark size="lg" />
      <span className="rg-logo__product rg-logo__product--wordmark">{APP_NAME}</span>
      {subtitle ? <p className="rg-logo__sub rg-logo__sub--center">{subtitle}</p> : null}
    </div>
  );
}
