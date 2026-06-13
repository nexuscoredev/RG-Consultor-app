import { lazy, Suspense, useEffect, useState } from 'react';

const Lottie = lazy(() => import('lottie-react'));

type Variant = 'box' | 'search';

const SRC: Record<Variant, string> = {
  box: '/lottie/empty-box.json',
  search: '/lottie/empty-search.json',
};

type Props = {
  variant?: Variant;
  className?: string;
};

function LottiePlayer({ variant }: { variant: Variant }) {
  const [data, setData] = useState<object | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(SRC[variant])
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [variant]);

  if (failed) return <span className="lottie-empty__fallback" aria-hidden>📭</span>;
  if (!data) return <span className="lottie-empty__fallback" aria-hidden>📭</span>;

  return (
    <Lottie animationData={data} loop autoplay style={{ width: 120, height: 120 }} aria-hidden />
  );
}

export function LottieEmpty({ variant = 'box', className }: Props) {
  return (
    <div className={`lottie-empty${className ? ` ${className}` : ''}`}>
      <Suspense fallback={<span className="lottie-empty__fallback" aria-hidden>📭</span>}>
        <LottiePlayer variant={variant} />
      </Suspense>
    </div>
  );
}
