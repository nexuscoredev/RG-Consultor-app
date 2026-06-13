type Size = 'sm' | 'md' | 'lg' | 'xl';

type Props = {
  size?: Size;
  tone?: 'brand' | 'light' | 'inherit';
  className?: string;
};

export function RgMark({ size = 'md', tone = 'brand', className = '' }: Props) {
  return (
    <span
      className={`rg-mark rg-mark--${size} rg-mark--${tone}${className ? ` ${className}` : ''}`.trim()}
      aria-hidden>
      <span className="rg-mark__r">R</span>
      <span className="rg-mark__g">g</span>
    </span>
  );
}
