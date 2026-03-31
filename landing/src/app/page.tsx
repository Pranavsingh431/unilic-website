'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from 'framer-motion';

const screenshotFeatures = [
  {
    id: 'attendance',
    title: 'Smart Attendance',
    description: 'Hybrid GPS + token verification with anti-spoof detection.',
    image: '/attendance.jpeg',
  },
  {
    id: 'grading',
    title: 'Automated Grading',
    description: 'Upload marks, configure policies, compute grades instantly.',
    image: '/grading.jpeg',
  },
  {
    id: 'send_marks',
    title: 'Send Marks Instantly',
    description: 'Send personalized marks to students via email in one click.',
    image: '/send_marks.jpeg',
  },
  {
    id: 'dashboard',
    title: 'Unified Dashboard',
    description: 'Manage courses, assignments, and discussions seamlessly.',
    image: '/dashboard.jpeg',
  },
] as const;

function FadeUp({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  const [index, setIndex] = useState(0);
  const [manualSelection, setManualSelection] = useState(false);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const showcaseInView = useInView(showcaseRef, { amount: 0.45 });
  const { scrollYProgress } = useScroll({
    target: showcaseRef,
    offset: ['start end', 'end start'],
  });
  const steppedIndex = useTransform(scrollYProgress, [0, 1], [0, screenshotFeatures.length - 1]);
  const activeFeature = screenshotFeatures[index];

  useEffect(() => {
    if (!showcaseInView || manualSelection) {
      return;
    }

    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % screenshotFeatures.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [manualSelection, showcaseInView]);

  useEffect(() => {
    if (!manualSelection) {
      return;
    }

    const timeout = setTimeout(() => setManualSelection(false), 6000);
    return () => clearTimeout(timeout);
  }, [manualSelection]);

  useMotionValueEvent(steppedIndex, 'change', (latest) => {
    if (!showcaseInView || manualSelection) {
      return;
    }

    const nextIndex = Math.max(0, Math.min(screenshotFeatures.length - 1, Math.round(latest)));
    setIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Unilic Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <p className="text-lg font-semibold text-slate-900">Unilic</p>
              <p className="text-xs text-slate-500">Academic operations platform</p>
            </div>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#product" className="text-sm text-slate-600 transition hover:text-slate-900">
              Product
            </Link>
            <Link href="/support" className="text-sm text-slate-600 transition hover:text-slate-900">
              Support
            </Link>
            <Link href="/terms" className="text-sm text-slate-600 transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-slate-600 transition hover:text-slate-900">
              Privacy
            </Link>
          </div>
          <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Open portal
            </Link>
          </motion.div>
        </div>
      </nav>

      <main>
        <section className="px-6 pb-20 pt-16">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <FadeUp>
                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  Built for modern classrooms
                </span>
              </FadeUp>
              <FadeUp className="space-y-4">
                <h1 className="text-5xl font-semibold leading-tight text-slate-900 md:text-6xl">
                  One platform for attendance, grading, course delivery, and communication.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  Unilic gives faculty and students a cleaner way to run academic operations across mobile and web,
                  without the usual patchwork of tools.
                </p>
              </FadeUp>
              <FadeUp className="flex flex-col gap-4 sm:flex-row">
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Link
                    href="/auth"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700"
                  >
                    Enter Unilic
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
                  <Link
                    href="#product"
                    className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-blue-300 hover:text-slate-900"
                  >
                    Explore product
                  </Link>
                </motion.div>
              </FadeUp>
            </div>

            <FadeUp>
              <div className="rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(248,250,252,1))] p-8 shadow-sm">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-500">Faculty</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Marks, grading, resources, assignments</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-500">Students</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Courses, submissions, discussions, grades</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <p className="text-sm font-medium text-slate-500">Mobile</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">Live attendance, lock mode, GPS verification</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </section>

        <section ref={showcaseRef} id="product" className="border-y border-slate-200 bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <FadeUp className="mb-12 text-center">
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Everything you need, in one platform
              </h2>
              <p className="mt-3 text-lg text-slate-600">
                From attendance to grading, built for modern classrooms and real academic workflows.
              </p>
            </FadeUp>

            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-4">
                {screenshotFeatures.map((feature, featureIndex) => (
                  <motion.button
                    key={feature.id}
                    onClick={() => {
                      setIndex(featureIndex);
                      setManualSelection(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className={`w-full rounded-2xl border p-5 text-left ${
                      index === featureIndex
                        ? 'border-blue-200 bg-blue-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{feature.description}</p>
                  </motion.button>
                ))}
              </div>

              <div className="relative flex min-h-[560px] items-center justify-center">
                <motion.div
                  className="absolute inset-0 rounded-full bg-blue-500 opacity-10 blur-3xl"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div className="relative mx-auto w-[320px]" style={{ willChange: 'transform' }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeFeature.image}
                      initial={{ opacity: 0, scale: 0.98, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.985, y: -8 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="will-change-transform"
                    >
                      <div className="rounded-[40px] bg-black p-3 shadow-2xl">
                        <motion.div
                          className="overflow-hidden rounded-[30px] bg-black animate-float"
                          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                        >
                          <motion.div
                            key={activeFeature.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          >
                            <Image
                              src={activeFeature.image}
                              alt={activeFeature.title}
                              width={320}
                              height={680}
                              priority={activeFeature.id === 'attendance'}
                              className="w-full object-cover"
                            />
                          </motion.div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl rounded-[32px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1),_rgba(239,246,255,1))] p-12 text-center shadow-sm">
            <FadeUp>
              <h2 className="text-4xl font-semibold text-slate-900">Ready to move beyond patched-together portals?</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Unilic gives IIT faculty and students a more coherent product experience for course operations.
              </p>
            </FadeUp>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {['Faster operations', 'Cleaner student experience', 'One shared system'].map((item) => (
                <FadeUp key={item}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      {item}
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
              <Link
                href="/auth"
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white transition hover:bg-blue-700"
              >
                Open the platform
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-slate-900">Unilic</p>
            <p className="mt-1 text-sm text-slate-500">Academic operations platform for IIT Ropar.</p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <Link href="/support" className="transition hover:text-slate-900">
              Support
            </Link>
            <Link href="/terms" className="transition hover:text-slate-900">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-slate-900">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
