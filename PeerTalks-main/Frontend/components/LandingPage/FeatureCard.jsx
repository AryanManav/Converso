export default function FeatureCard({ heading, desc, icon }) {
  return (
    <div className="group h-full bg-white rounded-2xl p-7 border border-zinc-200/80 shadow-subtle hover:shadow-card hover:border-primary-200 transition-all flex flex-col justify-between">
      <div>
        <div className="w-12 h-12 rounded-xl bg-zinc-100 group-hover:bg-primary-50 group-hover:text-primary-600 text-zinc-700 flex items-center justify-center transition-colors mb-5">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-zinc-900 mb-2">
          {heading}
        </h3>
        <p className="text-sm text-zinc-600 leading-relaxed">
          {desc}
        </p>
      </div>
      <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center text-xs font-semibold text-primary-600 group-hover:translate-x-1 transition-transform">
        Explore feature →
      </div>
    </div>
  );
}

