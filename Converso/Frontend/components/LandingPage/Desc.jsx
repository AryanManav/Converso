import { TbBolt, TbLockCheck, TbUsers } from "react-icons/tb";

export default function Desc() {
  const highlights = [
    {
      icon: <TbBolt className="w-6 h-6 text-primary-600" />,
      title: "Real-Time Engine",
      desc: "Powered by Socket.IO for sub-millisecond message delivery, instant typing notifications, and live status synchronization.",
    },
    {
      icon: <TbUsers className="w-6 h-6 text-primary-600" />,
      title: "Peer Discovery",
      desc: "Find friends by username, send connection requests with one click, and build your personal circle without algorithmic noise.",
    },
    {
      icon: <TbLockCheck className="w-6 h-6 text-primary-600" />,
      title: "Clean & Distraction-Free",
      desc: "Zero clutter, no ad banners, no convoluted feeds. Just pure communication built with modern engineering standards.",
    },
  ];

  return (
    <section className="py-20 bg-zinc-50/50 border-b border-zinc-200/70">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">
            Designed for clarity and speed
          </h2>
          <p className="mt-3 text-zinc-600 text-sm sm:text-base">
            Everything you need for seamless peer-to-peer conversations, engineered with a modern tech stack.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-subtle hover:shadow-card hover:border-zinc-300 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mb-5">
                {item.icon}
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}