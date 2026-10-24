export default function Logo({ className = "h-14 w-14" }) {
  return (
    <img
      src="/icon-512.png"
      alt="Shiv Shakti Fast Food"
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
