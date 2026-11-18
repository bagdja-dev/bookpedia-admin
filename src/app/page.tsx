import Image from 'next/image';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { Merriweather, Plus_Jakarta_Sans, Sora } from 'next/font/google';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react';

import { AuthErrorNotice } from '@/components/auth-error-notice';
import styles from './page.module.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

const FREE_SIGNUP_HREF = '/auth/login?next=%2Fdashboard%2Fplatforms%2Fnew';

const benefits = [
  {
    icon: '📝',
    title: 'Zero-Tech Publishing',
    description:
      'Upload .docx langsung jadi buku cantik. Drag-drop bab, auto format pakai Merriweather yang enak dibaca. Tidak ada shortcode aneh, tidak ada plugin konflik.',
    features: ['Import DOCX & Google Docs', 'Auto chapter & TOC', 'Typography editorial siap pakai'],
  },
  {
    icon: '💸',
    title: 'Monetisasi Built-in',
    description:
      'Langganan bulanan pembaca, jual per bab, donasi, split royalty transparan. Beda dari platform lain yang potong 50%, kami cuma 10% di early bird — bahkan 0% di Pro nanti.',
    features: ['Langganan & pay-per-chapter', 'QRIS, VA, eWallet lokal', 'Laporan transparan real-time'],
  },
  {
    icon: '📖',
    title: 'Reader Experience Juara',
    description:
      'Bukan sekadar PDF viewer. Mode baca nyaman, progress tracking, bookmark, dark mode baca, catatan. Pembaca betah, retensi naik 3x.',
    features: ['Mode baca fokus & nyaman', 'Progress & bookmark', 'Komentar per paragraf'],
  },
];

const includedFeatures = [
  {
    icon: '🧱',
    title: 'Homepage Sections',
    description: 'Drag & drop hero, buku unggulan, testimoni pembaca. Seperti Notion, tapi untuk landing buku.',
  },
  {
    icon: '🎨',
    title: 'Platform Settings',
    description: 'Atur kategori, tema warna, font pairing, logo. Ganti dalam 2 klik, preview langsung.',
  },
  {
    icon: '👥',
    title: 'Staff Invite & Role',
    description: 'Undang editor, admin CS, penulis tamu. Role jelas: Owner, Editor, Support.',
  },
  {
    icon: '📊',
    title: 'Analytics Pembaca',
    description: 'Tau bab mana yang paling dibaca, jam berapa orang baca, dari mana traffic-nya.',
  },
  {
    icon: '🇮🇩',
    title: 'Payment Gateway Indonesia',
    description: 'QRIS, Virtual Account BCA/BNI/Mandiri, GoPay, OVO, Dana — auto split.',
  },
  {
    icon: '🔍',
    title: 'SEO Otomatis + Domain Custom',
    description: 'Sitemap, meta, OG image auto. Nanti bisa pakai domain sendiri tanpa pindah hosting.',
  },
];

const plans = [
  {
    name: 'Early Bird FREE',
    status: 'AKTIF SEKARANG',
    price: 'Rp 0',
    period: '/bulan selamanya',
    description: 'Untuk 500 pendaftar pertama. Lock harga selamanya, tanpa syarat.',
    features: [
      'Unlimited buku & bab',
      '1 staff / editor',
      'Subdomain bookpedia.my.id',
      'Payment QRIS + VA',
      'Komisi platform 10%',
      'Support Discord prioritas',
    ],
    action: 'Klaim Slot Gratis',
    featured: true,
  },
  {
    name: 'Starter',
    status: 'DATANG 2026 Q3',
    price: 'Rp 99rb',
    period: '/bulan',
    description: 'Untuk yang sudah punya pembaca tetap dan mau brand sendiri.',
    features: [
      'Custom domain',
      '3 staff & role',
      'Analytics lengkap',
      'SEO & newsletter',
      'Komisi 5%',
      'Hapus watermark',
    ],
    action: 'Segera Hadir',
  },
  {
    name: 'Pro',
    status: 'UNTUK PENERBIT & AGENCY',
    price: 'Rp 249rb',
    period: '/bulan',
    description: 'White-label penuh, API, dan 0% komisi. Kamu punya semuanya.',
    features: [
      'Unlimited staff',
      'White-label & API',
      'Priority support',
      'Custom integrasi',
      '0% komisi platform',
      'Onboarding call',
    ],
    action: 'Segera Hadir',
  },
];

const steps = [
  {
    number: '01',
    icon: '⚡',
    title: 'Daftar 2 Menit',
    description: 'Pakai email, pilih nama penerbit, langsung masuk dashboard. Tidak perlu kartu kredit.',
  },
  {
    number: '02',
    icon: '📤',
    title: 'Upload Naskah',
    description: 'Drag .docx atau paste dari Google Docs. Bab otomatis ke-detect, format Merriweather langsung jadi.',
  },
  {
    number: '03',
    icon: '💳',
    title: 'Share Link & Dapat Bayaran',
    description: 'Atur harga langganan atau per bab, connect QRIS, share link. Pembaca bayar, kamu dapat notifikasi.',
  },
];

const faqs = [
  {
    question: 'Apakah benar gratis? Tidak ada jebakan?',
    answer:
      'Ya, benar-benar gratis untuk 500 pendaftar pertama. Tanpa kartu kredit, tanpa trial 14 hari. Kamu dapat subdomain bookpedia.my.id, unlimited buku, dan komisi hanya 10%. Kami butuh feedback jujur, bukan uang kamu di awal. Setelah 500 slot habis, pendaftaran baru akan masuk ke waitlist Starter berbayar.',
  },
  {
    question: 'Nanti kalau berbayar, yang daftar sekarang gimana?',
    answer:
      'Tetap gratis selamanya. Ini yang kami sebut grandfathered. Selama akun kamu aktif dan patuh ToS, tidak akan ditagih. Kami hanya akan monetisasi dari pendaftar baru setelah fase early access. Jadi klaim sekarang = lock harga Rp 0/bulan for life.',
  },
  {
    question: 'Bedanya dengan Gramedia Digital / Google Play Books apa?',
    answer:
      'Mereka adalah marketplace — brand mereka, data pembaca mereka, algoritma mereka. Bookpedia adalah platform milikmu sendiri. Brand-mu, domain-mu (nanti), data email pembaca-mu, harga-mu. Kamu yang kontrol. Kami hanya sediakan teknologinya, seperti Shopify tapi untuk buku.',
  },
  {
    question: 'Perlu coding? Bisa pakai domain sendiri?',
    answer:
      'Tidak perlu coding sama sekali. Semua drag & drop. Untuk custom domain, fitur akan rilis di paket Starter (Rp 99rb/bulan) nanti. Tapi yang daftar FREE sekarang akan dapat diskon 50% selamanya saat upgrade, kalau mau pakai domain sendiri. Setup domain kami bantu — cuma ganti DNS 2 menit.',
  },
  {
    question: 'Bagaimana dengan hak cipta & pembayaran?',
    answer:
      'Hak cipta 100% tetap milik kamu. Kami hanya platform. Pembayaran masuk langsung ke rekening kamu via gateway Indonesia (Midtrans/Xendit) — kami tidak pegang uang pembaca. Laporan transparan, pencairan H+1. Kontrak jelas, tidak ada klaim kepemilikan naskah.',
  },
];

export const metadata = {
  title: 'Bookpedia — Platform Penerbitan Buku yang Akhirnya Ramah Penulis',
  description:
    'Bikin website buku profesional seperti punya tim tech sendiri. Upload naskah, atur bab, terima pembayaran. Tanpa coding. Dari Garut untuk penulis Indonesia.',
  openGraph: {
    title: 'Bookpedia — Platform Penerbitan Buku yang Akhirnya Ramah Penulis',
    description:
      'Bikin website buku profesional seperti punya tim tech sendiri. Upload naskah, atur bab, terima pembayaran. Tanpa coding. Dari Garut untuk penulis Indonesia.',
    type: 'website',
    locale: 'id_ID',
    siteName: 'Bookpedia',
  },
  twitter: {
    card: 'summary',
    title: 'Bookpedia — Platform Penerbitan Buku yang Akhirnya Ramah Penulis',
    description:
      'Bikin website buku profesional seperti punya tim tech sendiri. Upload naskah, atur bab, terima pembayaran. Tanpa coding. Dari Garut untuk penulis Indonesia.',
  },
};

function Logo({ footer = false }: { footer?: boolean }) {
  return (
    <span className={styles.logo}>
      <Image src="/bookpedia-logo.png" alt="" width={42} height={42} priority={!footer} />
      <span className={styles.logoName}>Bookpedia</span>
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  light = false,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
  light?: boolean;
}) {
  return (
    <div className={`${styles.sectionHeading} ${light ? styles.sectionHeadingLight : ''}`}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2>{title}</h2>
      <p className={styles.sectionDescription}>{description}</p>
    </div>
  );
}

function AdminPreview() {
  return (
    <div className={styles.previewFrame} id="admin-preview">
      <div className={styles.browserBar}>
        <div className={styles.browserDots} aria-hidden="true"><i /><i /><i /></div>
        <div className={styles.addressBar}>bookpedia.my.id/admin/buku/cara-menulis</div>
        <span className={styles.autosave}><i /> Auto-save • Merriweather</span>
      </div>
      <div className={styles.previewApp}>
        <aside className={styles.previewSidebar}>
          <div className={styles.previewBrand}><Logo /></div>
          <p>Penerbit Saya</p>
          <span><LayoutDashboard /> Dashboard</span>
          <span className={styles.previewNavActive}><BookOpen /> Buku Saya</span>
          <span><Users /> Pembaca</span>
          <span><CreditCard /> Pembayaran</span>
          <span><Settings /> Pengaturan</span>
          <div className={styles.storageLabel}>Penyimpanan <b>68%</b></div>
          <div className={styles.storageTrack}><i /></div>
          <small>68% dari unlimited (FREE)</small>
        </aside>
        <div className={styles.previewContent}>
          <div className={styles.previewPageTitle}>
            <div><small>BUKU AKTIF</small><strong>Cara Menulis Novel dalam 30 Hari — Edisi Revisi</strong></div>
            <span>24 BAB</span>
          </div>
          <div className={styles.previewMetrics}>
            <div><small>📚 PEMBACA</small><strong>1.240</strong></div>
            <div><small>PENDAPATAN</small><strong>Rp 2,4jt</strong></div>
            <div><small>SELESAI</small><strong>68%</strong></div>
          </div>
          <div className={styles.chapterList}>
            <div><span>Bab 1 • Kenapa Menulis Itu Habit</span><b>100%</b></div>
            <div><span>Bab 2 • Outline yang Anti Buntu</span><b>100%</b></div>
            <div><span>Bab 3 • Draft Kasar Tanpa Sensor</span><b>92%</b></div>
            <div><span>Bab 4 • Revisi Ala Editor Indie</span><b>—</b></div>
          </div>
          <div className={styles.paymentNotice}><span>↗</span><div><small>PEMBAYARAN MASUK</small><strong>+Rp 150.000 dari pembaca baru</strong></div></div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className={`${styles.page} ${sora.variable} ${plusJakartaSans.variable} ${merriweather.variable}`}>
      <Suspense fallback={null}><AuthErrorNotice /></Suspense>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" aria-label="Bookpedia — Beranda"><Logo /></Link>
          <span className={styles.location}>GARUT • ID</span>
          <nav className={styles.mainNav} aria-label="Navigasi utama">
            <a href="#fitur">Fitur</a>
            <a href="#keunggulan">Keunggulan</a>
            <a href="#harga">Harga</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className={styles.headerActions}>
            <Link className={styles.loginButton} href="/auth/login">Masuk</Link>
            <Link className={styles.smallPrimaryButton} href={FREE_SIGNUP_HREF}>Coba Gratis</Link>
          </div>
          <nav className={styles.mobileNav} aria-label="Navigasi halaman">
            <a href="#fitur">Fitur</a>
            <a href="#keunggulan">Keunggulan</a>
            <a href="#harga">Harga</a>
            <a href="#faq">FAQ</a>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.promo}>🎉 <span>Gratis 100% untuk 500 pendaftar pertama - tanpa kartu kredit</span></div>
        <div className={styles.heroCopy}>
          <h1>
            Platform Penerbitan
            <br className={styles.heroBreak} />
            <span className={styles.heroAccent}>Buku yang Akhirnya</span>
            <br />
            <span className={styles.heroMuted}>Ramah Penulis</span>
          </h1>
          <p>
            Bikin website buku profesional seperti punya tim tech sendiri. Upload naskah, atur bab,
            terima pembayaran. Tanpa coding. Dari Garut untuk penulis Indonesia.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href={FREE_SIGNUP_HREF}>Mulai Gratis Sekarang <ArrowRight /></Link>
            <a className={styles.secondaryButton} href="#admin-preview">Lihat Demo Admin</a>
          </div>
          <div className={styles.socialProof}>
            <div className={styles.avatarStack} aria-hidden="true"><span>A</span><span>R</span><span>K</span></div>
            <p><strong>Dipercaya 120+ penulis indie & penerbit kecil</strong><br /><span>Rating 4.9/5 dari early tester di Discord</span></p>
          </div>
        </div>
        <AdminPreview />
      </section>

      <section className={styles.positioning}>
        <div className={styles.positioningInner}>
          <div className={styles.positionTitle}>
            <p className={styles.eyebrow}>BRAND POSITION</p>
            <span className={styles.positionQuote}>Built for writers,<br />not web admins</span>
            <h2>Untuk Penulis yang Capek Jadi Admin Website</h2>
          </div>
          <div className={styles.positionCopy}>
            <p className={styles.eyebrow}>POSITIONING STATEMENT</p>
            <p className={styles.positionDescription}>
              Untuk penulis indie, penerbit kecil, dan creator edukasi di Indonesia yang ingin punya
              platform baca sendiri, Bookpedia adalah platform penerbitan all-in-one yang membuat
              penerbitan semudah nulis di Google Docs. Tidak seperti WordPress + plugin yang ribet,
              kami fokus ke pengalaman baca yang enak dan admin yang super user-friendly.
            </p>
            <div className={styles.audienceGrid}>
              <div><strong>Penulis Indie</strong><span>Punya 1-3 buku, jual langsung tanpa marketplace.</span></div>
              <div><strong>Penerbit Kecil</strong><span>Kelola 20+ judul, atur staff & royalty.</span></div>
              <div><strong>Creator Kelas</strong><span>Jual bab sebagai modul belajar premium.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="keunggulan">
        <SectionHeading
          eyebrow="USP • WHY US"
          title={<>3 Alasan Penulis Pindah<br />ke Bookpedia</>}
          description="Kami tidak coba jadi semua hal. Kami fokus jadi yang terbaik di 3 hal yang penulis butuh hari ini."
        />
        <div className={styles.benefitGrid}>
          {benefits.map((benefit) => (
            <article className={styles.benefitCard} key={benefit.title}>
              <span className={styles.emojiIcon} aria-hidden="true">{benefit.icon}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
              <ul>{benefit.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.includedSection} id="fitur">
        <div className={styles.section}>
          <SectionHeading
            eyebrow="FITUR LENGKAP • TANPA RIBET"
            title={<>Semua yang kamu butuh,<br />sudah di dalam</>}
            description="Tidak perlu 12 plugin. Tidak perlu developer. Bookpedia sudah include homepage builder, payment, SEO, sampai invite staff."
          />
          <div className={styles.includedGrid}>
            {includedFeatures.map((feature) => (
              <article className={styles.includedCard} key={feature.title}>
                <span className={styles.featureEmoji} aria-hidden="true">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="harga">
        <SectionHeading
          eyebrow="STRATEGI PRICING • JUJUR"
          title="Gratis Dulu, Tumbuh Bareng"
          description="Saat ini FREE selamanya untuk 500 early adopter. Nanti kami akan beralih ke model langganan seperti sewa website — mirip Shopify untuk penulis. Yang daftar sekarang di-lock FREE selamanya (grandfathered)."
        />
        <div className={styles.pricingGrid}>
          {plans.map((plan) => (
            <article className={`${styles.planCard} ${plan.featured ? styles.featuredPlan : ''}`} key={plan.name}>
              {plan.featured && <div className={styles.popularBadge}>🔥 PALING POPULER • SAAT INI</div>}
              <div className={styles.planHeader}>
                <h3>{plan.name}</h3>
                <span className={styles.planStatus}>{plan.status}</span>
              </div>
              <p className={styles.price}>{plan.price}<span>{plan.period}</span></p>
              <p className={styles.planDescription}>{plan.description}</p>
              <ul className={styles.planFeatures}>
                {plan.features.map((feature) => <li key={feature}><Check />{feature}</li>)}
              </ul>
              {plan.featured ? (
                <>
                  <Link className={styles.planPrimaryButton} href={FREE_SIGNUP_HREF}>{plan.action}</Link>
                  <p className={styles.slotsRemaining}>Sisa 214 slot • update real-time</p>
                </>
              ) : <button className={styles.planSecondaryButton} type="button" disabled>{plan.action}</button>}
            </article>
          ))}
        </div>
        <aside className={styles.pricingNote}><span>💡</span><p>Kenapa gratis dulu? Kami percaya validasi dari penulis nyata lebih berharga dari revenue awal. 500 orang pertama akan shaping produk bareng tim Garut — dan dapat grandfathered FREE selamanya sebagai terima kasih. Strategi ini mirip Notion & Figma di awal.</p></aside>
      </section>

      <section className={styles.processSection}>
        <div className={styles.section}>
          <SectionHeading
            eyebrow=""
            title={<>Dari naskah berantakan<br />jadi platform baca<br />dalam 15 menit</>}
            description="Tidak ada onboarding call yang lama. Kamu bisa live hari ini juga, tanpa nunggu tim tech."
            light
          />
          <div className={styles.stepsGrid}>
            {steps.map((step) => (
              <article className={styles.stepCard} key={step.number}>
                <span className={styles.stepNumber}>{step.number}</span>
                <span className={styles.stepEmoji} aria-hidden="true">{step.icon}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.faqLayout}>
          <div className={styles.faqIntro}>
            <p className={styles.eyebrow}>FAQ • YANG SERING DITANYA</p>
            <h2>Jujur saja, tanpa marketing fluff</h2>
            <p className={styles.faqLead}>Kalau masih ragu, tanya langsung di Discord. Tim Garut bales cepat — biasanya di bawah 2 jam jam kerja.</p>
            <aside className={styles.migrationNote}><span>💬</span><div><strong>Butuh bantuan migrasi?</strong><p>Kirim naskah & link website lama, kami bantu pindahin gratis untuk 50 pendaftar pertama.</p></div></aside>
          </div>
          <div className={styles.faqList}>
            {faqs.map((faq, index) => (
              <details className={styles.faqItem} key={faq.question} open={index === 0}>
                <summary>{faq.question}<ChevronRight aria-hidden="true" /></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta} id="final-cta">
        <div className={styles.finalCtaInner}>
          <div className={styles.finalCtaContent}>
            <p className={styles.eyebrow}>214 SLOT GRATIS TERSISA</p>
            <h2>Siap Punya Platform<br />Buku Sendiri?</h2>
            <p className={styles.finalCtaDescription}>Bergabung dengan 120+ penulis yang sudah pindah dari ribetnya WordPress. Setup 2 menit, tanpa kartu kredit, bisa custom domain nanti.</p>
            <Link className={styles.finalCtaButton} href={FREE_SIGNUP_HREF}>Klaim Gratis <ArrowRight /></Link>
            <p className={styles.reassurance}>Tanpa kartu kredit • Setup 2 menit • Bisa custom domain nanti</p>
          </div>
          <div className={styles.checklistCard}>
            <div className={styles.checklistHeading}><div><span className={styles.liveDot} /> LIVE</div><strong>LIVE CHECKLIST • EARLY ADOPTER</strong></div>
            <div className={styles.checklistRow}><span className={styles.doneCheck}>✓</span><span>Akun dibuat</span><b>DONE</b></div>
            <div className={styles.checklistRow}><span className={styles.doneCheck}>✓</span><span>Subdomain aktif</span><b>DONE</b></div>
            <div className={styles.checklistRow}><span className={styles.pendingCheck}>○</span><span>Upload bab pertama</span></div>
            <div className={styles.checklistRow}><span className={styles.pendingCheck}>○</span><span>Atur pembayaran</span></div>
            <div className={styles.checklistConfetti}>🎉</div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          <div><p className={styles.footerMade}>🎉 Dibuat di Garut untuk Indonesia</p><Logo footer /><p className={styles.copyright}>© 2026 — Made in Garut, West Java • Fokus Nulis. Biar Kami yang Urus Tekninya.</p></div>
          <nav className={styles.footerLinks} aria-label="Tautan informasi">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Discord</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
