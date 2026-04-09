import CoinRain from "@/components/CoinRain";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full relative">
      <CoinRain />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
