import Footer from "@/components/footer";
import Image from "next/image";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
};

const products: Product[] = [
  {
    id: 1,
    name: "Ginseng Coffee Shots",
    price: 32,
    category: "Energy",
    image: "https://picsum.photos/seed/ginseng/640/420",
    description: "Instant focus, sustained vitality.",
  },
  {
    id: 2,
    name: "Sleep-Well Tea",
    price: 28,
    category: "Rest",
    image: "https://picsum.photos/seed/sleep/640/420",
    description: "Calm mind, deep restoration.",
  },
  {
    id: 3,
    name: "Hangover Awake Shot",
    price: 35,
    category: "Recovery",
    image: "https://picsum.photos/seed/revive/640/420",
    description: "Liver support & rapid hydration.",
  },
];

function currency(n: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(n);
}

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col animate-fade-in bg-stone-50 text-stone-800 selection:bg-stone-200 selection:text-stone-900">

      <main className="flex-1 w-full max-w-7xl mx-auto px-6">
        {/* Hero */}
        <section className="relative pt-28 pb-12 md:pt-36 md:pb-20 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-medium text-stone-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                New released
              </div>

              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
                Get your new Gadget
                <br />
                <span className="text-stone-400">Easy Life Style</span>
              </h1>

              <p className="text-lg text-stone-500 max-w-lg">
                Functional coffee and tea infusions powered by traditional Chinese adaptogens. Energy without the jitters, sleep without the grogginess.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a href="/shop" className="inline-flex h-12 items-center justify-center rounded-full bg-stone-900 px-8 text-sm font-medium text-white hover:bg-stone-800 transition-all">
                  Shop Collection
                </a>
                <a href="/philosophy" className="inline-flex h-12 items-center justify-center rounded-full border border-stone-200 bg-white px-8 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-all">
                  Our Ingredients
                </a>
              </div>

              <div className="flex items-center gap-6 pt-6 text-stone-400 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span>100% Organic</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span></span>
                </div>
              </div>
            </div>

            {/* Abstract visual / product mockup */}
            <div className="relative aspect-[4/3] md:h-[520px] w-full bg-stone-200 rounded-3xl overflow-hidden">
              <Image src="https://i.pinimg.com/736x/e7/36/de/e736de55f104af85eb12eabd780d177a.jpg" alt="Product mockup" fill />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,113,108,0.06),transparent_40%)]" />
            </div>
          </div>
        </section>

        {/* Marquee (seamless looping) */}
        <div className="w-full overflow-hidden py-8 border-y border-stone-200 bg-white">
          <div className="relative">
            <div
              className="animate-marquee flex whitespace-nowrap gap-16 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500 will-change-transform"
              aria-hidden="true"
            >
              <span className="text-lg font-bold tracking-tight px-4">NY TIMES</span>
              <span className="text-lg font-bold tracking-tight px-4">VOGUE WELLNESS</span>
              <span className="text-lg font-bold tracking-tight px-4">MONOCLE</span>
              <span className="text-lg font-bold tracking-tight px-4">HYPEBEAST</span>
              <span className="text-lg font-bold tracking-tight px-4">WELL+GOOD</span>
              <span className="text-lg font-bold tracking-tight px-4">NY TIMES</span>

              {/* duplicate once for seamless loop */}
              <span className="text-lg font-bold tracking-tight px-4">NY TIMES</span>
              <span className="text-lg font-bold tracking-tight px-4">VOGUE WELLNESS</span>
              <span className="text-lg font-bold tracking-tight px-4">MONOCLE</span>
              <span className="text-lg font-bold tracking-tight px-4">HYPEBEAST</span>
              <span className="text-lg font-bold tracking-tight px-4">WELL+GOOD</span>
              <span className="text-lg font-bold tracking-tight px-4">NY TIMES</span>
            </div>
          </div>
        </div>

        {/* Curated Formulas / Products */}
        <section id="products" className="py-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-stone-900 mb-2">Curated Formulas</h2>
              <p className="text-stone-500 max-w-lg">Designed to support your body's natural circadian rhythm from sunrise to recovery.</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-full border border-stone-200 hover:bg-stone-100 transition-colors text-stone-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button className="p-2 rounded-full border border-stone-200 hover:bg-stone-100 transition-colors text-stone-600">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((p) => (
              <div key={p.id} className="group relative flex flex-col">
                <div className="aspect-[4/5] w-full bg-white rounded-2xl relative overflow-hidden mb-6 shadow-sm border">
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-3/4 h-3/4 bg-white rounded-xl shadow-lg border flex flex-col items-center justify-center gap-4 relative">
                      <div className="absolute top-4 right-4 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wide">
                        {p.id === 1 ? "AM" : p.id === 2 ? "PM" : "SOS"}
                      </div>
                      <div className={`w-16 h-16 rounded-full mb-2 flex items-center justify-center ${p.id === 2 ? "bg-indigo-100 text-indigo-600" : p.id === 3 ? "bg-emerald-100 text-emerald-600" : "bg-stone-900 text-amber-500"}`}>
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none"><path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div className="text-center">
                        <h3 className="font-serif text-2xl text-stone-900">{p.name.split(" ")[0]}</h3>
                        <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">{p.name.split(" ").slice(1).join(" ")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-stone-900 group-hover:text-amber-700 transition-colors">{p.name}</h3>
                    <p className="text-sm text-stone-500 mt-1">{p.description}</p>
                  </div>
                  <span className="text-lg font-medium text-stone-900">{currency(p.price)}</span>
                </div>

                <button className="mt-4 w-full py-3 rounded-xl border border-stone-200 text-sm font-medium text-stone-900 hover:bg-stone-900 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 group-hover:border-stone-900">
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section id="philosophy" className="py-16 bg-white border-t border-stone-100">
          <div className="max-w-7xl mx-auto px-0">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-stone-900">Ancient wisdom meets molecular science.</h2>
                <p className="text-stone-500 leading-relaxed">
                  We don't just add flavor. We integrate functional Traditional Chinese Medicine (TCM) herbs that have been used for centuries to balance the body's Qi. Our extraction process ensures high bioavailability of active compounds like ginsenosides and jujubosides.
                </p>

                <ul className="space-y-4">
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-stone-700" viewBox="0 0 24 24" fill="none"><path d="M12 2v20" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </div>
                    <div>
                      <h4 className="text-stone-900 font-medium">Yin-Yang Balance</h4>
                      <p className="text-sm text-stone-500 mt-1">Formulations designed to neutralize the heating or cooling nature of ingredients.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center">
                      <svg className="w-5 h-5 text-stone-700" viewBox="0 0 24 24" fill="none"><path d="M12 2v20" stroke="currentColor" strokeWidth="1.5"/></svg>
                    </div>
                    <div>
                      <h4 className="text-stone-900 font-medium">Adaptogenic Power</h4>
                      <p className="text-sm text-stone-500 mt-1">Herbs that help the body resist stressors of all kinds, whether physical, chemical or biological.</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-stone-100 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border">
                    <h4 className="text-2xl font-semibold text-stone-900 mb-1">98<span className="text-sm text-stone-500 font-normal">%</span></h4>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Purity</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border translate-y-8">
                    <h4 className="text-2xl font-semibold text-stone-900 mb-1">0<span className="text-sm text-stone-500 font-normal">g</span></h4>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Added Sugar</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border -translate-y-4">
                    <h4 className="text-2xl font-semibold text-stone-900 mb-1">3<span className="text-sm text-stone-500 font-normal">x</span></h4>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Absorption</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border translate-y-4">
                    <h4 className="text-2xl font-semibold text-stone-900 mb-1">5<span className="text-sm text-stone-500 font-normal">k+</span></h4>
                    <p className="text-xs text-stone-500 uppercase tracking-wide">Reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bundle Builder Mockup */}
        <section className="py-16">
          <div className="bg-stone-900 rounded-3xl text-white overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center p-8 md:p-16 gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-block px-3 py-1 bg-stone-800 border border-stone-700 rounded-full text-xs font-medium text-stone-300">Subscribe & Save</div>
                <h2 className="text-2xl md:text-4xl font-semibold tracking-tight">Build your Daily Ritual</h2>
                <p className="text-stone-400 max-w-md">Customize a monthly box with your preferred mix of Energy, Sleep, and Recovery shots. Save 15% and get free shipping.</p>

                <div className="space-y-4 pt-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-300">Ginseng Coffee</span>
                      <span className="font-mono">10 shots</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-amber-500 rounded-full" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-stone-300">Sleep-Well Tea</span>
                      <span className="font-mono">10 packs</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1/3 bg-indigo-500 rounded-full" />
                    </div>
                  </div>
                </div>

                <button className="bg-white text-stone-900 px-8 py-3 rounded-full font-medium text-sm hover:bg-stone-100 transition-colors mt-6 w-full md:w-auto">Start Subscription</button>
              </div>

              <div className="flex-1 w-full max-w-sm">
                <div className="bg-stone-800/50 backdrop-blur-sm border border-stone-700 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-stone-700 pb-4">
                    <span className="font-medium">Summary</span>
                    <span className="font-medium">$85.00/mo</span>
                  </div>
                  <ul className="space-y-3 text-sm text-stone-400 mb-6">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>Monthly delivery</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>Cancel anytime</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span>Free limited edition mug</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
