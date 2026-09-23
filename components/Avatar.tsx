import Image from "next/image";

export function Avatar({
  src,
  name,
  size = 40,
  priority = false,
}: {
  src?: string;
  name: string;
  size?: number;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <span className="avatar-fallback" style={{ width: size, height: size }}>
        {name.slice(0, 1)}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="avatar"
      style={{ width: size, height: size }}
      unoptimized
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
