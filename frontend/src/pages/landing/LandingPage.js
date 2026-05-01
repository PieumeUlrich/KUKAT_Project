import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import api from '../../api/client';

// ── Unsplash travel images (no API key needed) ────────────────
const HERO_SLIDES = [
  {
    url: '/images/wallpaper1.jpg',
    label: 'Explore the world',
    sub: 'Unforgettable journeys await',
  },
  {
    url: '/images/wallpaper2.jpg',
    label: 'Coastal escapes',
    sub: 'Sun, sand and serenity',
  },
  {
    url: '/images/wallpaper3.jpg',
    label: 'Mountain adventures',
    sub: 'Where the air is pure',
  },
  {
    url: '/images/wallpaper4.jpg',
    label: 'City breaks',
    sub: 'Culture, cuisine & connection',
  },
  {
    url: '/images/wallpaper5.jpg',
    label: 'Luxury cruises',
    sub: 'Sailing to extraordinary places',
  },
  {
    url: '/images/wallpaper6.png',
    label: 'Nature retreats',
    sub: 'Reconnect with the great outdoors',
  },
];

const CAROUSEL_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1534008757030-27299c4371b6?w=500&q=80', label: 'Santorini, Greece',    sub: 'Mediterranean' },
  { url: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&q=80', label: 'Rome, Italy',          sub: 'Europe' },
  { url: 'https://images.unsplash.com/photo-1549144511-f099e773c147?w=500&q=80', label: 'Bali, Indonesia',      sub: 'Asia Pacific' },
  { url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=500&q=80', label: 'Taj Mahal, India',    sub: 'South Asia' },
  { url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=500&q=80', label: 'Paris, France',       sub: 'Europe' },
  { url: 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=500&q=80', label: 'Machu Picchu, Peru', sub: 'South America' },
  { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=500&q=80', label: 'Dubai, UAE',          sub: 'Middle East' },
  { url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=500&q=80', label: 'Kyoto, Japan',        sub: 'East Asia' },
  { url: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=500&q=80', label: 'Maldives',            sub: 'Indian Ocean' },
  { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&q=80', label: 'Banff, Canada',       sub: 'North America' },
];

const DEST_IMAGES = [
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=80',
  'https://images.unsplash.com/photo-1549144511-f099e773c147?w=600&q=80',
  'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80',
];

// ── Scroll animation hook ─────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── Animated counter ──────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const ref      = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const target    = parseFloat(value) || 0;
        const steps     = 60;
        const increment = target / steps;
        let current     = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) { setDisplay(target); clearInterval(timer); }
          else setDisplay(Math.floor(current));
        }, 1800 / steps);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

const FEATURES = [
  { icon: '✈️', bg: '#EFF6FF', title: 'Global Reach',
    desc: 'Access to thousands of destinations worldwide through our network of trusted supplier partners across every continent.' },
  { icon: '🤝', bg: '#FEF9C3', title: 'Expert Agents',
    desc: 'Our certified travel agents craft personalized itineraries tailored to your preferences, timeline and budget.' },
  { icon: '💼', bg: '#DCFCE7', title: 'Group Bookings',
    desc: 'Seamless management of group travel — from family reunions to corporate retreats — with split payment options.' },
  { icon: '🔒', bg: '#F3E8FF', title: 'Secure & Transparent',
    desc: 'Every booking is tracked, invoiced and audited. Full financial transparency with real-time payment status.' },
  { icon: '🌟', bg: '#FEF3C7', title: 'Exclusive Deals',
    desc: 'Our supplier relationships unlock commission-backed discounts and promotions not available to the public.' },
  { icon: '📱', bg: '#CCFBF1', title: 'Modern Platform',
    desc: 'A fully digital booking experience — from quote to invoice — managed through our state-of-the-art system.' },
];

// ── Main component ────────────────────────────────────────────
export default function LandingPage() {
  const navigate = useNavigate();

  const [scrolled,      setScrolled]      = useState(false);
  const [heroSlide,     setHeroSlide]     = useState(0);
  const [stats,         setStats]         = useState(null);
  const [destinations,  setDestinations]  = useState([]);
  const [promotions,    setPromotions]    = useState([]);
  const [suppliers,     setSuppliers]     = useState([]);

  // Contact section form
  const [contactForm,    setContactForm]    = useState({
    firstName: '', lastName: '', email: '',
    phone: '', travelType: '', message: '',
  });
  const [contactErrors,  setContactErrors]  = useState({});
  const [contactSending, setContactSending] = useState(false);
  const [contactSent,    setContactSent]    = useState(false);

  useScrollReveal();

  // Auto-advance hero slides
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Nav scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load backend data
  useEffect(() => {
    api.get('/public/stats')
      .then(({ data }) => setStats(data)).catch(() => {});
    api.get('/public/destinations')
      .then(({ data }) => setDestinations(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/public/promotions')
      .then(({ data }) => setPromotions(Array.isArray(data) ? data : [])).catch(() => {});
    api.get('/public/suppliers')
      .then(({ data }) => setSuppliers(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // ── Contact section handlers ────────────────────────────────
  const setContact = (f) => (e) => {
    setContactForm(p => ({ ...p, [f]: e.target.value }));
    setContactErrors(p => ({ ...p, [f]: '' }));
  };
  const scrollTo = (id) => (e) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const validateContact = (form) => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim())  e.lastName  = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.message.trim())   e.message   = 'Please describe what you need';
    return e;
  };

  const handleContactSubmit = async () => {
    const e = validateContact(contactForm);
    if (Object.keys(e).length) { setContactErrors(e); return; }
    setContactSending(true);
    try {
      await api.post('/public/contact', contactForm);
      setContactSent(true);
    } catch { setContactSent(true); }
    finally { setContactSending(false); }
  };

  const carouselImages = [...CAROUSEL_IMAGES, ...CAROUSEL_IMAGES];

  return (
    <div className="landing">

      {/* ── Navigation ─────────────────────────────────── */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#home" className="nav-logo">
          <div className="nav-logo-icon"><span>✈</span></div>
          <span className="nav-logo-text">KUKAT</span>
        </a>
        <ul className="nav-links">
          <li><a href="#destinations" onClick={scrollTo('destinations')}>Destinations</a></li>
          <li><a href="#promotions" onClick={scrollTo('promotions')}>Promotions</a></li>
          <li><a href="#about" onClick={scrollTo('about')}>About</a></li>
          <li><a href="#contact" onClick={scrollTo('contact')}>Contact</a></li>
          <li>
            <a href="/login" className="nav-cta"
              onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
              Staff login
            </a>
          </li>
        </ul>
      </nav>

      {/* ── Hero with sliding images ────────────────────── */}
      <section id="home" className="hero">
        <div className="hero-slides">
          {HERO_SLIDES.map((slide, i) => (
            <div
              key={i}
              className={`hero-slide ${i === heroSlide ? 'active' : ''}`}
              style={{ backgroundImage: `url(${slide.url})` }}
            />
          ))}
        </div>

        <div className="hero-bg">
          <div className="hero-circle-1" />
          <div className="hero-circle-2" />
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            <span>Calgary's Premier Travel Agency</span>
          </div>
          <h1 className="hero-title">
            Your journey<br />begins with<br /><em>KUKAT</em>
          </h1>
          <p className="hero-subtitle">
            We craft extraordinary travel experiences — from solo adventures
            to group expeditions — backed by a network of world-class
            suppliers and expert agents who care deeply about every detail.
          </p>
          <div className="hero-actions">
            <button className="btn-primary"
              onClick={() => document.getElementById('destinations')
                ?.scrollIntoView({ behavior: 'smooth' })}>
              Explore destinations
            </button>
            <button className="btn-secondary"
              onClick={() => document.getElementById('contact')
                ?.scrollIntoView({ behavior: 'smooth' })}>
              Talk to an agent
            </button>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="hero-slide-indicators">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-slide-dot ${i === heroSlide ? 'active' : ''}`}
              onClick={() => setHeroSlide(i)}
            />
          ))}
        </div>

        <div className="hero-scroll">
          <div className="hero-scroll-line" />
          <span>scroll</span>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────── */}
      <div className="stats">
        <div className="stats-grid">
          {[
            { value: stats?.totalBookings     ?? 0, label: 'Bookings completed', suffix: '+' },
            { value: stats?.totalCustomers    ?? 0, label: 'Happy travellers',    suffix: '+' },
            { value: stats?.totalDestinations ?? 0, label: 'Destinations served', suffix: '+' },
            { value: stats?.totalSuppliers    ?? 0, label: 'Supplier partners',   suffix: '' },
            { value: stats?.totalAgents       ?? 0, label: 'Expert agents',       suffix: '' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <div className="stat-value">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scrolling image carousel strip ─────────────── */}
      <div className="carousel-strip">
        <div className="carousel-track">
          {carouselImages.map((img, i) => (
            <div key={i} className="carousel-img">
              <img src={img.url} alt={img.label} loading="lazy" />
              <div className="carousel-img-label">
                {img.label}
                <span>{img.sub}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Destinations ───────────────────────────────── */}
      <section id="destinations">
        <div className="section">
          <div className="section-label fade-in">
            <div className="section-label-line" />
            <span>Where we go</span>
          </div>
          <h2 className="section-title fade-in">
            Our most popular<br /><em>destinations</em>
          </h2>
          <p className="section-sub fade-in">
            From coastal retreats to mountain adventures — explore the
            destinations our clients love most, curated from real booking data.
          </p>
          <div className="destinations-grid">
            {(destinations.length > 0 ? destinations : [
              { destinationID: 'p1', destinationName: 'Paris',     region: 'France' },
              { destinationID: 'p2', destinationName: 'Tokyo',     region: 'Japan' },
              { destinationID: 'p3', destinationName: 'Cancún',    region: 'Mexico' },
              { destinationID: 'p4', destinationName: 'Vancouver', region: 'BC, Canada' },
              { destinationID: 'p5', destinationName: 'Rome',      region: 'Italy' },
              { destinationID: 'p6', destinationName: 'Dubai',     region: 'UAE' },
            ]).map((d, i) => (
              <div key={d.destinationID} className="dest-card fade-in">
                {/* Real photo behind each destination card */}
                <div className="dest-card-img">
                  <img
                    src={DEST_IMAGES[i % DEST_IMAGES.length]}
                    alt={d.destinationName}
                    loading="lazy"
                  />
                </div>
                <div className="dest-card-overlay" />
                <div className="dest-card-content">
                  <div className="dest-rank">{String(i + 1).padStart(2, '0')}</div>
                  <div className="dest-name">{d.destinationName}</div>
                  <div className="dest-region">{d.region || 'International'}</div>
                  {d.bookingCount > 0 && (
                    <div className="dest-bookings">
                      <span>✈ {d.bookingCount} bookings</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promotions ─────────────────────────────────── */}
      <div id="promotions" className="promos-section">
        <div className="promos-inner">
          <div className="section-label fade-in">
            <div className="section-label-line" />
            <span>Featured deals</span>
          </div>
          <h2 className="section-title fade-in">
            Exclusive <em>partner offers</em>
          </h2>
          <p className="section-sub fade-in">
            Our supplier partnerships unlock commission-backed savings
            that we pass directly to our clients.
          </p>
          <div className="promos-grid">
            {(promotions.length > 0 ? promotions : [
              { supplierID: 'p1', supplierName: 'Luxury Cruises',    commissionRate: 15, productCount: 8 },
              { supplierID: 'p2', supplierName: 'Premium Airlines',  commissionRate: 12, productCount: 5 },
              { supplierID: 'p3', supplierName: 'Resort Collection', commissionRate: 18, productCount: 12 },
              { supplierID: 'p4', supplierName: 'Adventure Tours',   commissionRate: 14, productCount: 6 },
              { supplierID: 'p5', supplierName: 'City Hotels',       commissionRate: 10, productCount: 9 },
              { supplierID: 'p6', supplierName: 'Rail Europe',       commissionRate: 11, productCount: 4 },
            ]).map((p) => (
              <div key={p.supplierID} className="promo-card fade-in">
                <div className="promo-card-accent" />
                <div className="promo-badge"><span>⭐ Featured partner</span></div>
                <div className="promo-supplier">{p.supplierName}</div>
                <div className="promo-location">
                  {[p.city, p.country].filter(Boolean).join(', ') || 'International'}
                </div>
                <div className="promo-rate">
                  <span className="promo-rate-value">
                    {parseFloat(p.commissionRate || 0).toFixed(0)}%
                  </span>
                  <span className="promo-rate-label">commission savings</span>
                </div>
                <div className="promo-products">
                  <strong>{p.productCount}</strong> active product{p.productCount !== 1 ? 's' : ''} available
                  {p.affiliationCode && (
                    <span style={{ marginLeft: 8, color: '#0D9488', fontWeight: 600 }}>
                      · {p.affiliationCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why KUKAT ──────────────────────────────────── */}
      <section id="about" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/wallpaper6.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.10,
          zIndex: 0,
          pointerEvents: 'none',
        }} />
        
        {/* Content wrapper */}
        <div className="section" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-label fade-in">
            <div className="section-label-line" />
            <span>Why choose us</span>
          </div>
          <h2 className="section-title fade-in">
            Travel made <em>effortless</em>
          </h2>
          <p className="section-sub fade-in">
            We combine decades of travel expertise with modern technology
            to deliver seamless experiences from first inquiry to safe return.
          </p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card fade-in"
                style={{ transitionDelay: `${i * 0.08}s` }}>
                <div className="feature-icon" style={{ background: f.bg }}>{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Partner logos sliding strip ────────────────────── */}
      {suppliers.length > 0 && (
        <div className="logos-strip">
          <div className="logos-track">
            {[...suppliers, ...suppliers].map((s, i) => (
              <div key={i} className="logo-item">
                <div className="logo-img-wrap">
                  <img
                    src={`${process.env.PUBLIC_URL}/images/logos/${s.supplierID}.png` || `${process.env.PUBLIC_URL}/images/logos/${s.supplierID}.svg`}
                    alt={s.supplierName}
                    onError={(e) => {
                      if (e.target.src.endsWith('.png')) {
                        e.target.src = `/images/logos/${s.supplierID}.svg`;
                      } else {
                      e.target.parentElement.outerHTML = `
                        <div class="logo-fallback">
                          ${s.supplierName?.slice(0, 2).toUpperCase()}
                        </div>`;
                      }
                    }}
                  />
                </div>
                <span className="logo-name">{s.supplierName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Supplier partners ───────────────────────────── */}
      <div className="suppliers-section">
        <div className="suppliers-inner">
          <div className="suppliers-header">
            <div>
              <div className="section-label fade-in" style={{ marginBottom: 12 }}>
                <div className="section-label-line" />
                <span>Our network</span>
              </div>
              <h2 className="section-title fade-in"
                style={{ color: '#fff', marginBottom: 0 }}>
                Trusted <em style={{ color: '#F59E0B' }}>partners</em>
              </h2>
            </div>
            <p className="fade-in" style={{
              color: 'rgba(255,255,255,0.4)', maxWidth: 360,
              fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 300,
            }}>
              We work exclusively with vetted, accredited suppliers
              who share our commitment to quality and client satisfaction.
            </p>
          </div>
          <div className="suppliers-grid">
            {(suppliers.length > 0 ? suppliers :
              Array.from({ length: 8 }, (_, i) => ({
                supplierID: `p${i}`, supplierName: `Partner ${i + 1}`,
              }))
            ).map((s, i) => (
              <div key={s.supplierID} className="supplier-chip fade-in"
                style={{ transitionDelay: `${i * 0.05}s` }}>
                <div className="supplier-name">{s.supplierName}</div>
                <div className="supplier-location">
                  {[s.city, s.country].filter(Boolean).join(', ') || 'International'}
                </div>
                {s.productCount > 0 && (
                  <div className="supplier-products">
                    {s.productCount} product{s.productCount !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contact section ─────────────────────────────── */}
      <div id="contact" className="contact-section">
        <div className="contact-bg-circle"
          style={{ width: 500, height: 500, top: -250, right: -150 }} />
        <div className="contact-bg-circle"
          style={{ width: 300, height: 300, bottom: -150, left: -80 }} />

        <div className="contact-inner">

          {/* Left — company details */}
          <div className="contact-left">
            <div className="section-label fade-in" style={{ marginBottom: 16 }}>
              <div className="section-label-line" />
              <span>Get in touch</span>
            </div>
            <h2 className="contact-title fade-in">
              Let's plan your<br /><em>dream trip</em>
            </h2>
            <p className="contact-sub fade-in">
              Our expert agents are ready to craft your perfect itinerary.
              Reach out and we'll respond within 24 hours.
            </p>

            <div className="contact-details fade-in">
              <div className="contact-detail-item">
                <div className="contact-detail-icon">📍</div>
                <div className="contact-detail-text">
                  <div className="contact-detail-label">Address</div>
                  <div className="contact-detail-value">
                    123 Travel Lane, Suite 400<br />
                    Calgary, AB T2P 1J9, Canada
                  </div>
                </div>
              </div>
              <div className="contact-detail-item">
                <div className="contact-detail-icon">📞</div>
                <div className="contact-detail-text">
                  <div className="contact-detail-label">Phone</div>
                  <div className="contact-detail-value">
                    <a href="tel:+14031234567">+1 (403) 123-4567</a>
                  </div>
                </div>
              </div>
              <div className="contact-detail-item">
                <div className="contact-detail-icon">✉️</div>
                <div className="contact-detail-text">
                  <div className="contact-detail-label">Email</div>
                  <div className="contact-detail-value">
                    <a href="mailto:info@kukat.ca">info@kukat.ca</a><br />
                    <a href="mailto:ulrich.everthingoldcanada@gmail.com"
                      style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      ulrich.everthingoldcanada@gmail.com
                    </a>
                  </div>
                </div>
              </div>
              <div className="contact-detail-item">
                <div className="contact-detail-icon">🌐</div>
                <div className="contact-detail-text">
                  <div className="contact-detail-label">Social</div>
                  <div className="contact-detail-value">
                    <a href="/">@KUKATTravel</a> · Instagram · Facebook · LinkedIn
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-hours fade-in">
              <div className="contact-hours-title">⏰ Office hours</div>
              {[
                { day: 'Monday — Friday',  time: '9:00 AM — 6:00 PM MST' },
                { day: 'Saturday',          time: '10:00 AM — 4:00 PM MST' },
                { day: 'Sunday',            time: 'Closed' },
              ].map((h, i) => (
                <div key={i} className="contact-hours-row">
                  <span className="contact-hours-day">{h.day}</span>
                  <span className="contact-hours-time">{h.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — inline contact form */}
          <div className="contact-right fade-in">
            <div className="contact-form-card">
              {!contactSent ? (
                <>
                  <div className="contact-form-title">Send us a message</div>
                  <div className="contact-form-sub">
                    Fill in the form and an agent will be in touch within 24 hours.
                  </div>
                  <div className="contact-form">
                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label className="contact-form-label">First name *</label>
                        <input className={`contact-form-input ${contactErrors.firstName ? 'error' : ''}`}
                          placeholder="John" value={contactForm.firstName}
                          onChange={setContact('firstName')} />
                        {contactErrors.firstName && (
                          <span className="contact-form-error">{contactErrors.firstName}</span>
                        )}
                      </div>
                      <div className="contact-form-group">
                        <label className="contact-form-label">Last name *</label>
                        <input className={`contact-form-input ${contactErrors.lastName ? 'error' : ''}`}
                          placeholder="Smith" value={contactForm.lastName}
                          onChange={setContact('lastName')} />
                        {contactErrors.lastName && (
                          <span className="contact-form-error">{contactErrors.lastName}</span>
                        )}
                      </div>
                    </div>
                    <div className="contact-form-row">
                      <div className="contact-form-group">
                        <label className="contact-form-label">Email *</label>
                        <input className={`contact-form-input ${contactErrors.email ? 'error' : ''}`}
                          type="email" placeholder="john@example.com"
                          value={contactForm.email} onChange={setContact('email')} />
                        {contactErrors.email && (
                          <span className="contact-form-error">{contactErrors.email}</span>
                        )}
                      </div>
                      <div className="contact-form-group">
                        <label className="contact-form-label">Phone</label>
                        <input className="contact-form-input" type="tel"
                          placeholder="+1 (403) 000-0000"
                          value={contactForm.phone} onChange={setContact('phone')} />
                      </div>
                    </div>
                    <div className="contact-form-group">
                      <label className="contact-form-label">Type of travel</label>
                      <select className="contact-form-select"
                        value={contactForm.travelType} onChange={setContact('travelType')}>
                        <option value="">— Select a category —</option>
                        <option value="leisure">Leisure / Vacation</option>
                        <option value="business">Business travel</option>
                        <option value="group">Group / Family trip</option>
                        <option value="honeymoon">Honeymoon / Anniversary</option>
                        <option value="adventure">Adventure / Expedition</option>
                        <option value="cruise">Cruise</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div className="contact-form-group">
                      <label className="contact-form-label">Tell us about your trip *</label>
                      <textarea
                        className={`contact-form-textarea ${contactErrors.message ? 'error' : ''}`}
                        placeholder="Destinations in mind, travel dates, group size, budget, special requirements…"
                        value={contactForm.message} onChange={setContact('message')}
                      />
                      {contactErrors.message && (
                        <span className="contact-form-error">{contactErrors.message}</span>
                      )}
                    </div>
                    <button className="contact-form-submit"
                      disabled={contactSending} onClick={handleContactSubmit}>
                      {contactSending ? (
                        <>
                          <span style={{
                            width: 16, height: 16,
                            border: '2px solid #0B2B40',
                            borderTopColor: 'transparent',
                            borderRadius: '50%',
                            animation: 'spin 0.7s linear infinite',
                            display: 'inline-block',
                          }} />
                          Sending…
                        </>
                      ) : '✈ Send enquiry'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="contact-success">
                  <div className="contact-success-icon">✅</div>
                  <div className="contact-success-title">Message received!</div>
                  <p className="contact-success-sub">
                    Thank you, <strong style={{ color: '#fff' }}>{contactForm.firstName}</strong>!
                    One of our agents will reach out to{' '}
                    <strong style={{ color: '#F59E0B' }}>{contactForm.email}</strong>{' '}
                    within 24 hours.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div className="nav-logo-icon" style={{ width: 28, height: 28, fontSize: 13 }}>
                <span>✈</span>
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>KUKAT</span>
            </div>
            <p className="footer-copy">
              © {new Date().getFullYear()} KUKAT Travel Agency · Calgary, AB, Canada
            </p>
          </div>
          <ul className="footer-links">
            <li><a href="#destinations" onClick={scrollTo('destinations')}>Destinations</a></li>
            <li><a href="#promotions" onClick={scrollTo('promotions')}>Promotions</a></li>
            <li><a href="#about" onClick={scrollTo('about')}>About</a></li>
            <li><a href="#contact" onClick={scrollTo('contact')}>Contact</a></li>
            <li>
              <a href="/login"
                onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                Staff login
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}