export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bg.jpg"
        alt=""
        className="h-full w-full scale-110 object-cover opacity-10 blur-[1px]"
      />
    </div>
  );
}
