type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors";
  const variants = {
    primary: "bg-[#FF6A00] text-white hover:opacity-90",
    secondary: "bg-[#BE8C53] text-white hover:opacity-90",
    ghost: "bg-transparent text-[#202C3B] hover:bg-black/5",
  } as const;
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}


