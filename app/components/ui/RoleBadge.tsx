interface RoleBadgeProps {
  name: string;
  color: number; // Discord colour integer (0 means default)
}

export default function RoleBadge({ name, color }: RoleBadgeProps) {
  const bgColor = color ? `#${color.toString(16).padStart(6, '0')}` : '#4b5563';
  return (
    <span
      className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white mr-1 mb-1"
      style={{ backgroundColor: bgColor }}
    >
      {name}
    </span>
  );
}
