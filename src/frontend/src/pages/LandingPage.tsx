import { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Stars, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Zap, Brain, Calendar, TrendingUp, Users, CheckCircle2,
  ArrowRight, Sparkles, Shield, MessageSquare, ChevronDown
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

// ─── 3D Scene Components ──────────────────────────────────────────────────────

function FloatingOrb({ position, color, speed = 1 }: {
  position: [number, number, number];
  color: string;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.2;
    meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh ref={meshRef} position={position}>
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial
            color={color}
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.1}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </Sphere>
      </mesh>
    </Float>
  );
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 600;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
  }

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#C9A84C"
        size={0.04}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function RotatingRing() {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = state.clock.elapsedTime * 0.3;
    ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2 + 0.5;
  });

  return (
    <mesh ref={ringRef} position={[0, 0, -2]}>
      <torusGeometry args={[3.5, 0.03, 16, 100]} />
      <meshStandardMaterial
        color="#C9A84C"
        metalness={1}
        roughness={0}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
}

function HeroScene() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[5, 5, 5]} intensity={2} color="#4AA3FF" />
      <pointLight position={[-5, -3, 2]} intensity={1.5} color="#C9A84C" />
      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.5} />
      <ParticleField />
      <RotatingRing />
      <FloatingOrb position={[3, 1, -1]} color="#2563EB" speed={0.8} />
      <FloatingOrb position={[-3.5, -1.5, -2]} color="#C9A84C" speed={1.2} />
      <FloatingOrb position={[0, 2.5, -3]} color="#4AA3FF" speed={0.5} />
    </>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  color: 'gold' | 'blue';
  delay: string;
}) {
  return (
    <div
      className="reveal-up glass-card rounded-2xl p-6 card-hover group"
      style={{ animationDelay: delay }}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
          color === 'gold' ? 'bg-gold/15 text-gold' : 'bg-brand/15 text-brand-light'
        }`}
      >
        <Icon size={22} />
      </div>
      <h3 className="font-display font-semibold text-foreground mb-2 text-lg">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Stat Counter ─────────────────────────────────────────────────────────────

function StatCard({ value, label, suffix = '' }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center reveal-up">
      <div className="text-4xl font-bold font-display gradient-text-gold mb-1">
        {value}{suffix}
      </div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroCTARef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Hero entrance animation
    const tl = gsap.timeline({ delay: 0.3 });

    tl.fromTo(
      heroTextRef.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    )
      .fromTo(
        heroSubRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
        '-=0.5'
      )
      .fromTo(
        heroCTARef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo(
        scrollIndicatorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.6 },
        '-=0.2'
      );

    // GSAP ScrollTrigger for features
    const featureCards = document.querySelectorAll('.reveal-up');
    featureCards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          delay: i * 0.08,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    // Stats counter animation
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach((el) => {
      const target = parseInt(el.getAttribute('data-target') || '0', 10);
      gsap.fromTo(
        el,
        { textContent: 0 },
        {
          textContent: target,
          duration: 2,
          ease: 'power1.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
          },
        }
      );
    });

    // Horizontal scroll parallax for feature section
    if (featuresRef.current) {
      gsap.fromTo(
        featuresRef.current,
        { backgroundPositionX: '0%' },
        {
          backgroundPositionX: '100%',
          ease: 'none',
          scrollTrigger: {
            trigger: featuresRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const navigate = (path: string) => {
    window.location.hash = `#${path}`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #070B16 100%)' }}>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5" style={{ background: 'rgba(7,11,22,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold font-display text-sm tracking-wide text-foreground">
              ONBOARD<span className="text-gold">IQ</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'How it Works', 'Pricing'].map((item) => (
              <button key={item} type="button" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5">
                {item}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="px-4 py-2 text-sm font-medium bg-brand hover:bg-brand/90 text-white rounded-lg transition-all hover:shadow-blue-glow active:scale-95"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* 3D Canvas Background */}
        <div className="absolute inset-0 z-0">
          <Canvas
            className="three-canvas"
            camera={{ position: [0, 0, 8], fov: 60 }}
            gl={{ antialias: true, alpha: true }}
          >
            <HeroScene />
          </Canvas>
        </div>

        {/* Radial gradient overlay */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 30%, rgba(7,11,22,0.7) 70%, #070B16 100%)',
          }}
        />

        {/* Hero Content */}
        <div className="relative z-20 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/10 text-gold text-sm font-medium mb-8">
            <Sparkles size={14} />
            AI-Powered Employee Onboarding
          </div>

          <div ref={heroTextRef} style={{ opacity: 0 }}>
            <h1 className="text-5xl md:text-7xl font-bold font-display text-foreground leading-tight mb-6">
              Onboard smarter.{' '}
              <span className="gradient-text-gold">Ramp faster.</span>
            </h1>
          </div>

          <p
            ref={heroSubRef}
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ opacity: 0 }}
          >
            OnboardIQ uses AI to generate personalized 30-60-90 day plans,
            track progress, and guide every new hire through their journey — from
            day one to full productivity.
          </p>

          <div ref={heroCTARef} className="flex flex-col sm:flex-row gap-4 justify-center" style={{ opacity: 0 }}>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="magnetic-btn group px-8 py-4 bg-brand hover:bg-brand/90 text-white font-semibold rounded-xl transition-all hover:shadow-blue-glow active:scale-95 flex items-center gap-2 justify-center"
            >
              Start Free Today
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="magnetic-btn px-8 py-4 glass-card text-foreground font-semibold rounded-xl transition-all hover:border-white/20 active:scale-95"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div ref={scrollIndicatorRef} className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-muted-foreground" style={{ opacity: 0 }}>
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown size={16} className="animate-bounce" />
        </div>
      </section>

      {/* ── Stats Section ── */}
      <section ref={statsRef} className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard value="92" suffix="%" label="Faster Ramp-Up" />
            <StatCard value="30" suffix="+" label="AI-Generated Tasks" />
            <StatCard value="10" suffix="k+" label="Employees Onboarded" />
            <StatCard value="4.9" suffix="★" label="Employee Rating" />
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section ref={featuresRef} className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
              Everything your new hires need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From their first day to full autonomy — OnboardIQ handles the entire journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={Brain}
              title="AI Onboarding Plans"
              description="Gemini AI generates a personalized 30-60-90 day roadmap based on role, department, and seniority — automatically."
              color="blue"
              delay="0ms"
            />
            <FeatureCard
              icon={Calendar}
              title="Smart Timeline"
              description="Visual phase tracking from Day 0 to Day 90, with task dependencies, due dates, and real-time progress."
              color="gold"
              delay="80ms"
            />
            <FeatureCard
              icon={MessageSquare}
              title="AI Chatbot (Aria)"
              description="Your 24/7 onboarding assistant — answers questions, surfaces resources, and nudges action items."
              color="blue"
              delay="160ms"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Progress Dashboard"
              description="Real-time visual dashboard showing completion rates, phase progress, and upcoming milestones."
              color="gold"
              delay="0ms"
            />
            <FeatureCard
              icon={Users}
              title="Team Introductions"
              description="Structured plans for meeting key stakeholders, scheduling 1:1s, and getting plugged into team culture."
              color="blue"
              delay="80ms"
            />
            <FeatureCard
              icon={Shield}
              title="Compliance & Access"
              description="Never miss a compliance training or access request — all tracked in the onboarding timeline."
              color="gold"
              delay="160ms"
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              Up and running in minutes
            </h2>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-brand via-gold to-transparent hidden md:block" />
            {[
              { step: '01', title: 'Create your account', desc: 'Sign up and enter your role, department, and start date.' },
              { step: '02', title: 'AI generates your plan', desc: 'Gemini builds a personalized 30-60-90 day onboarding roadmap in seconds.' },
              { step: '03', title: 'Track and complete tasks', desc: 'Work through your plan, check off tasks, and watch your progress grow.' },
              { step: '04', title: 'Chat with Aria anytime', desc: 'Got questions? Your AI onboarding assistant is always available.' },
            ].map((item, i) => (
              <div key={item.step} className="reveal-up flex gap-8 mb-10 md:pl-16 relative">
                <div className="absolute left-0 top-1 w-12 h-12 rounded-full bg-gradient-to-br from-brand to-gold hidden md:flex items-center justify-center text-white font-bold text-sm font-display z-10">
                  {item.step}
                </div>
                <div className="glass-card rounded-2xl p-6 flex-1">
                  <div className="md:hidden text-xs font-bold text-gold mb-2">{item.step}</div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-gold/10 pointer-events-none" />
            <CheckCircle2 size={48} className="text-gold mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              Ready to transform onboarding?
            </h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of companies using OnboardIQ to give new hires the best start.
            </p>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="magnetic-btn px-10 py-4 bg-gold hover:bg-gold/90 text-navy font-bold rounded-xl transition-all hover:shadow-gold-glow active:scale-95 inline-flex items-center gap-2"
            >
              <Sparkles size={18} />
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-brand to-brand-light flex items-center justify-center">
              <Zap size={12} className="text-white" />
            </div>
            <span className="font-bold font-display text-xs text-foreground">
              ONBOARD<span className="text-gold">IQ</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} OnboardIQ · AI-Powered Employee Onboarding
          </p>
        </div>
      </footer>
    </div>
  );
}
