type Variant = 'wordmark' | 'compact' | 'sidebar' | 'hero';

type Props = {
  variant?: Variant;
  subtitle?: string;
  className?: string;
};

const LOGO_SRC = '/images/rg-ambiental-logo.png';

function LogoMark({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rg-logo__mark${className ? ` ${className}` : ''}`}>
      <div className="rg-logo__glow" aria-hidden />
      {children}
    </div>
  );
}

export function RgLogo({ variant = 'wordmark', subtitle, className = '' }: Props) {
  if (variant === 'hero') {
    return (
      <div className={`rg-logo rg-logo--hero ${className}`.trim()} aria-label="RG Ambiental">
        <LogoMark className="rg-logo__mark--hero">
          <img src={LOGO_SRC} alt="RG Ambiental" className="rg-logo__img rg-logo__img--hero" />
        </LogoMark>
        {subtitle ? <p className="rg-logo__sub rg-logo__sub--center">{subtitle}</p> : null}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`rg-logo rg-logo--compact ${className}`.trim()} aria-label="RG Ambiental Consultor">
        <LogoMark className="rg-logo__mark--compact">
          <img src={LOGO_SRC} alt="RG Ambiental" className="rg-logo__img rg-logo__img--compact" />
        </LogoMark>
        <div className="rg-logo__text">
          <span className="rg-logo__product">Consultor</span>
          {subtitle ? <span className="rg-logo__sub">{subtitle}</span> : null}
        </div>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={`rg-logo rg-logo--sidebar ${className}`.trim()} aria-label="RG Ambiental">
        <LogoMark className="rg-logo__mark--sidebar">
          <img src={LOGO_SRC} alt="RG Ambiental" className="rg-logo__img rg-logo__img--sidebar" />
        </LogoMark>
        <span className="rg-logo__product rg-logo__product--sidebar">Consultor</span>
        {subtitle ? <span className="rg-logo__sub">{subtitle}</span> : null}
      </div>
    );
  }

  return (
    <div className={`rg-logo rg-logo--wordmark ${className}`.trim()} aria-label="RG Ambiental">
      <LogoMark className="rg-logo__mark--wordmark">
        <img src={LOGO_SRC} alt="RG Ambiental" className="rg-logo__img rg-logo__img--wordmark" />
      </LogoMark>
      {subtitle ? <p className="rg-logo__sub rg-logo__sub--center">{subtitle}</p> : null}
    </div>
  );
}
