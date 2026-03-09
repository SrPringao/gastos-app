import { LoadingAnimation } from "@/components/loading-animation";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <LoadingAnimation />
    </div>
  );
}
