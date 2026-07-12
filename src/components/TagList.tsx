type TagListProps = {
  items: readonly string[];
  className?: string;
  label?: string;
};

export function TagList({ items, className = "", label }: TagListProps) {
  return (
    <div className={`tag-list ${className}`.trim()} aria-label={label}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}
