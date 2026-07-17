type TagListProps = {
  items: readonly string[];
  className?: string;
  label?: string;
};

const containsHangul = (value: string) => /[\uAC00-\uD7A3]/u.test(value);

export function TagList({ items, className = "", label }: TagListProps) {
  return (
    <div className={`tag-list ${className}`.trim()} aria-label={label}>
      {items.map((item) => (
        <span key={item} lang={containsHangul(item) ? "ko" : undefined}>{item}</span>
      ))}
    </div>
  );
}
