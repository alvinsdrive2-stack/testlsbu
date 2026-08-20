import Image from "next/image";

export function Backdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <Image
        src="/bg.jpg"
        alt=""
        fill
        sizes="100vw"
        className="scale-110 object-cover opacity-10 blur-[1px]"
      />
    </div>
  );
}
