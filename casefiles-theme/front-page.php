<?php
/**
 * Front Page Template - Hookly Style
 *
 * @package CaseFiles
 */

get_header();

$hero_badge     = casefiles_get( 'hero_badge_text', 'Built for Indian Lawyers' );
$hero_heading   = casefiles_get( 'hero_heading', 'The Legal Practice Engine for Indian Lawyers' );
$hero_desc      = casefiles_get( 'hero_description', 'Turn hours of manual research into minutes. Let AI find case laws, draft documents and manage your practice so you can get back to arguing.' );
$hero_cta_text  = casefiles_get( 'hero_cta_text', 'Start Free Trial' );
$hero_cta_url   = casefiles_get( 'hero_cta_url', '#' );
$stat1_val      = casefiles_get( 'stat1_value', '2,500+' );
$stat1_lbl      = casefiles_get( 'stat1_label', 'Lawyers Trust CaseFiles' );
$stat2_val      = casefiles_get( 'stat2_value', '15,000+' );
$stat2_lbl      = casefiles_get( 'stat2_label', 'Cases Managed' );
$stat3_val      = casefiles_get( 'stat3_value', '99.9%' );
$stat3_lbl      = casefiles_get( 'stat3_label', 'Uptime SLA' );
$stat4_val      = casefiles_get( 'stat4_value', '4.9/5' );
$stat4_lbl      = casefiles_get( 'stat4_label', 'Client Rating' );
$cta_heading    = casefiles_get( 'cta_heading', 'Ready to Transform Your Practice?' );
$cta_desc       = casefiles_get( 'cta_description', 'Join 2,500+ lawyers who manage their entire practice with CaseFiles.' );
?>

<!-- ===== HERO ===== -->
<main id="main-content" role="main">
<section class="hero" aria-label="<?php esc_attr_e( 'Hero Section', 'casefiles-theme' ); ?>">
    <div class="hero-content">
        <div class="hero-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <?php echo esc_html( $hero_badge ); ?>
        </div>
        <h1><?php echo wp_kses_post( str_replace( ' for', '<br> for', $hero_heading ) ); ?></h1>
        <p><?php echo esc_html( $hero_desc ); ?></p>
        <div class="hero-actions">
            <a href="<?php echo esc_url( $hero_cta_url ); ?>" class="btn-hero btn-hero-primary">
                <?php echo esc_html( $hero_cta_text ); ?>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#features" class="btn-hero btn-hero-outline">See Features</a>
        </div>
        <p class="hero-note">No credit card required &middot; 14-day free trial &middot; Cancel anytime</p>
    </div>

    <div class="hero-screenshot">
        <img src="<?php echo esc_url( CASEFILES_URI . '/screenshot.png' ); ?>" alt="CaseFiles dashboard showing case management and AI research features" loading="eager" />
    </div>
</section>

<!-- ===== STATS ===== -->
<section class="stats" aria-label="<?php esc_attr_e( 'Statistics', 'casefiles-theme' ); ?>">
    <div class="stats-inner">
        <div class="fade-in-up">
            <div class="stat-value"><?php echo esc_html( $stat1_val ); ?></div>
            <div class="stat-label"><?php echo esc_html( $stat1_lbl ); ?></div>
        </div>
        <div class="fade-in-up">
            <div class="stat-value"><?php echo esc_html( $stat2_val ); ?></div>
            <div class="stat-label"><?php echo esc_html( $stat2_lbl ); ?></div>
        </div>
        <div class="fade-in-up">
            <div class="stat-value"><?php echo esc_html( $stat3_val ); ?></div>
            <div class="stat-label"><?php echo esc_html( $stat3_lbl ); ?></div>
        </div>
        <div class="fade-in-up">
            <div class="stat-value"><?php echo esc_html( $stat4_val ); ?></div>
            <div class="stat-label"><?php echo esc_html( $stat4_lbl ); ?></div>
        </div>
    </div>
</section>

<!-- ===== FEATURES (What You Get) ===== -->
<section class="section section-alt" id="features" aria-label="<?php esc_attr_e( 'Product Features', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <div class="section-badge">What You Get</div>
            <h2>Everything You Need to<br><span class="highlight">Practice Better</span></h2>
            <p>Manage cases, research law, draft documents, track hearings, and bill clients &mdash; all in one place.</p>
        </div>
        <div class="product-grid">
            <div class="product-card fade-in-up">
                <div class="product-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                </div>
                <h3>Smart Case Management</h3>
                <p>Track every case with auto-numbering, status flows, hearing dates, and one-click e-filing integration.</p>
            </div>
            <div class="product-card fade-in-up">
                <div class="product-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.5 4.5-3 6h-8c-1.5-1.5-3-3.5-3-6a7 7 0 0 1 7-7z"/>
                        <path d="M9 14h6"/><path d="M9 18h6"/><path d="M8 22h8"/>
                    </svg>
                </div>
                <h3>AI Legal Research</h3>
                <p>Search IPC, CrPC, CPC, and 50,000+ judgments in seconds. Get case summaries and draft suggestions.</p>
            </div>
            <div class="product-card fade-in-up">
                <div class="product-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <h3>Client Portal</h3>
                <p>Give your clients real-time case updates, document sharing, and secure messaging &mdash; without phone calls.</p>
            </div>
            <div class="product-card fade-in-up">
                <div class="product-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <h3>Court Calendar</h3>
                <p>Never miss a hearing. Auto-sync with eCourts, cause lists, and get reminders via WhatsApp & SMS.</p>
            </div>
            <div class="product-card fade-in-up">
                <div class="product-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                </div>
                <h3>GST Invoicing</h3>
                <p>Generate professional GST-compliant invoices, track payments, send reminders, and manage trust accounts.</p>
            </div>
            <div class="product-card fade-in-up">
                <div class="product-card-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                </div>
                <h3>Bank-Grade Security</h3>
                <p>AES-256 encryption, DPDP Act compliant, data stored in India. Your clients' data is safe with us.</p>
            </div>
        </div>
    </div>
</section>

<!-- ===== THERE'S A BETTER WAY ===== -->
<section class="section" aria-label="<?php esc_attr_e( 'Better Way', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>There's a <span class="highlight">Better Way</span></h2>
        </div>
        <div class="way-grid">
            <div class="way-column old fade-in-up">
                <h3>The Old Way</h3>
                <div class="way-step">
                    <div class="way-step-label">Research</div>
                    <div class="way-step-desc">Hours scrolling through law journals, bare acts, and judgment databases manually</div>
                </div>
                <div class="way-step">
                    <div class="way-step-label">Drafting</div>
                    <div class="way-step-desc">Staring at a blank page copying old drafts that never quite fit</div>
                </div>
                <div class="way-step">
                    <div class="way-step-label">Tracking</div>
                    <div class="way-step-desc">Missing hearings because your calendar is a mess of spreadsheets</div>
                </div>
                <div class="way-quote">"I spent 4+ hours a day just managing my practice instead of practicing law."</div>
            </div>
            <div class="way-column new fade-in-up">
                <h3>The CaseFiles Way</h3>
                <div class="way-step">
                    <div class="way-step-label">Research</div>
                    <div class="way-step-desc">AI finds relevant case laws and precedents in your niche automatically</div>
                </div>
                <div class="way-step">
                    <div class="way-step-label">Drafting</div>
                    <div class="way-step-desc">Documents generated from proven patterns, tailored to your case in seconds</div>
                </div>
                <div class="way-step">
                    <div class="way-step-label">Tracking</div>
                    <div class="way-step-desc">Smart calendar with auto-reminders, eCourts sync, and cause list alerts</div>
                </div>
                <div class="way-quote">"From research to draft in under 5 minutes."</div>
            </div>
        </div>
    </div>
</section>

<!-- ===== SOLUTIONS ===== -->
<section class="section section-alt" id="solution" aria-label="<?php esc_attr_e( 'Solutions', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>Built for <span class="highlight">Every Practice</span></h2>
            <p>Whether you're a solo advocate or a full-service firm, CaseFiles scales with you.</p>
        </div>
        <div class="solution-grid">
            <div class="solution-card fade-in-up">
                <div class="solution-card-tag tag-solo">Solo Practice</div>
                <h3>For Individual Advocates</h3>
                <p>Manage your entire practice from one dashboard. Track cases, court dates, and clients without the overhead.</p>
                <ul>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Auto-numbering for all case types</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>WhatsApp reminders for hearings</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Quick invoice generation</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>AI research for case preparation</li>
                </ul>
            </div>
            <div class="solution-card fade-in-up">
                <div class="solution-card-tag tag-firm">Small Firm</div>
                <h3>For Growing Law Firms</h3>
                <p>Collaborate with your team, assign cases, and track billing across multiple advocates.</p>
                <ul>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Multi-user access with roles</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Case assignment &amp; tracking</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Team activity logs</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Shared document library</li>
                </ul>
            </div>
            <div class="solution-card fade-in-up">
                <div class="solution-card-tag tag-enterprise">Enterprise</div>
                <h3>For Large Firms &amp; Chambers</h3>
                <p>Full control with admin panels, custom branding, API access, and dedicated support.</p>
                <ul>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Unlimited users &amp; cases</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Custom branding &amp; white-label</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>API access &amp; integrations</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Dedicated account manager</li>
                </ul>
            </div>
            <div class="solution-card fade-in-up">
                <div class="solution-card-tag tag-team">Legal Teams</div>
                <h3>For Litigation Teams</h3>
                <p>Coordinate across multiple cases, share research, and manage court appearances efficiently.</p>
                <ul>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Multi-case coordination</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Shared research notes</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Court appearance scheduling</li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>Client communication hub</li>
                </ul>
            </div>
        </div>
    </div>
</section>

<!-- ===== COMPARISON TABLE ===== -->
<section class="section" aria-label="<?php esc_attr_e( 'Comparison', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>How CaseFiles <span class="highlight">Compares</span></h2>
            <p>Built specifically for legal practice, not generic text generation.</p>
        </div>
        <div class="comparison-section fade-in-up" style="max-width: 800px; margin: 0 auto;">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>CaseFiles</th>
                        <th>ChatGPT</th>
                        <th>Generic Tools</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>AI Legal Research</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>Learns your practice area</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>Generates case-specific drafts</td>
                        <td class="check">&#10003;</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>Court calendar sync</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>GST invoicing</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>Client portal</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>Built for Indian lawyers</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                    <tr>
                        <td>Saves 10+ hours per week</td>
                        <td class="check">&#10003;</td>
                        <td class="cross">&mdash;</td>
                        <td class="cross">&mdash;</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div style="text-align: center; margin-top: 32px;">
            <a href="<?php echo esc_url( $hero_cta_url ); ?>" class="btn-hero btn-hero-primary">Start Generating</a>
        </div>
    </div>
</section>

<!-- ===== TESTIMONIALS ===== -->
<section class="section section-alt" id="testimonials" aria-label="<?php esc_attr_e( 'Testimonials', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>Loved by <span class="highlight">Lawyers</span> Across India</h2>
            <p>See what advocates are saying about CaseFiles.</p>
        </div>
        <div class="testimonials-grid">
            <div class="testimonial-card fade-in-up">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <blockquote>&ldquo;CaseFiles replaced 5 different tools we were using. The AI research alone saves me 3 hours every day.&rdquo;</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">PS</div>
                    <div>
                        <div class="testimonial-name">Adv. Priya Sharma</div>
                        <div class="testimonial-role">Sharma &amp; Associates, Delhi</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-in-up">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <blockquote>&ldquo;Our clients love the portal. Everything is right there on their phone.&rdquo;</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">RK</div>
                    <div>
                        <div class="testimonial-name">Adv. Rajesh Kumar</div>
                        <div class="testimonial-role">Kumar Legal, Mumbai</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-in-up">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <blockquote>&ldquo;The court calendar integration is a game-changer. We haven't missed a single hearing since switching.&rdquo;</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">AD</div>
                    <div>
                        <div class="testimonial-name">Adv. Anita Desai</div>
                        <div class="testimonial-role">Desai Law Chambers, Bangalore</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-in-up">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <blockquote>&ldquo;As a solo practitioner, CaseFiles gives me the tools that only large firms had. GST invoicing alone pays for the subscription.&rdquo;</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">VM</div>
                    <div>
                        <div class="testimonial-name">Adv. Vikram Mehta</div>
                        <div class="testimonial-role">Mehta &amp; Co., Chennai</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-in-up">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <blockquote>&ldquo;We moved from spreadsheets to CaseFiles overnight. The team collaboration features are exactly what our firm needed.&rdquo;</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">SG</div>
                    <div>
                        <div class="testimonial-name">Adv. Sanjay Gupta</div>
                        <div class="testimonial-role">Gupta &amp; Partners, Hyderabad</div>
                    </div>
                </div>
            </div>
            <div class="testimonial-card fade-in-up">
                <div class="testimonial-stars">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <blockquote>&ldquo;The AI legal research found a landmark judgment that completely changed our strategy. CaseFiles is now indispensable.&rdquo;</blockquote>
                <div class="testimonial-author">
                    <div class="testimonial-avatar">NP</div>
                    <div>
                        <div class="testimonial-name">Adv. Nalini Patil</div>
                        <div class="testimonial-role">Patil Criminal Law, Pune</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ===== PRICING ===== -->
<section class="section" id="pricing" aria-label="<?php esc_attr_e( 'Pricing', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>Simple, <span class="highlight">Transparent</span> Pricing</h2>
            <p>Start free. Upgrade when you need more. No hidden fees.</p>
        </div>
        <div class="pricing-toggle">
            <span class="active" id="monthlyLabel">Monthly</span>
            <div class="toggle-switch" id="billingToggle" role="button" tabindex="0"></div>
            <span id="annualLabel">Annual <span style="color: #10b981; font-size: 12px; font-weight: 600;">Save 17%</span></span>
        </div>
        <?php
        $plans      = casefiles_get_pricing_plans();
        $plan_count = count( $plans );
        $grid_class = 'pricing-grid pricing-grid-' . $plan_count;
        ?>
        <div class="<?php echo esc_attr( $grid_class ); ?>">
            <?php foreach ( $plans as $plan ) :
                $name          = esc_html( $plan['name'] );
                $price         = intval( $plan['price'] );
                $annual_price  = $price > 0 ? round( $price * 10 / 12 ) : 0;
                $cases         = casefiles_format_cases( $plan['max_cases'] );
                $users         = casefiles_format_users( $plan['max_users'] );
                $storage       = casefiles_format_storage( $plan['max_storage_mb'] );
                $features      = ! empty( $plan['features'] ) ? $plan['features'] : array();
                $highlighted   = ! empty( $plan['highlighted'] );
                $badge         = ! empty( $plan['badge'] ) ? $plan['badge'] : '';
                $cta_text      = ! empty( $plan['cta_text'] ) ? $plan['cta_text'] : 'Get Started';
                $cta_url       = ! empty( $plan['cta_url'] ) ? $plan['cta_url'] : '#';
                $card_class    = 'pricing-card fade-in-up';
                if ( $highlighted ) {
                    $card_class .= ' highlighted';
                }
                $annual_billing = 'Billed &#8377;' . number_format( $annual_price * 12 ) . '/year';
                $monthly_billing = 'Billed monthly';
            ?>
            <div class="<?php echo esc_attr( $card_class ); ?>">
                <?php if ( $badge ) : ?>
                    <div class="pricing-card-badge"><?php echo esc_html( $badge ); ?></div>
                <?php endif; ?>
                <h3><?php echo $name; ?></h3>
                <?php if ( $price === 0 ) : ?>
                    <div class="pricing-card-price"><span class="currency">&#8377;</span><span class="amount">0</span></div>
                    <div class="pricing-card-desc">Try it out, no strings attached</div>
                <?php else : ?>
                    <div class="pricing-card-price"><span class="currency">&#8377;</span><span class="amount" data-monthly="<?php echo esc_attr( $price ); ?>" data-annual="<?php echo esc_attr( $annual_price ); ?>"><?php echo number_format( $price ); ?></span><span class="period">/month</span></div>
                    <div class="pricing-card-desc" data-monthly="<?php echo esc_attr( $monthly_billing ); ?>" data-annual="<?php echo esc_attr( $annual_billing ); ?>"><?php echo $monthly_billing; ?></div>
                <?php endif; ?>
                <ul class="pricing-card-features">
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><?php echo $cases; ?></li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><?php echo $users; ?></li>
                    <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><?php echo $storage; ?> storage</li>
                    <?php foreach ( $features as $feature ) : ?>
                        <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><?php echo esc_html( $feature ); ?></li>
                    <?php endforeach; ?>
                </ul>
                <a href="<?php echo esc_url( $cta_url ); ?>" class="pricing-card-cta <?php echo $highlighted ? 'cta-primary' : 'cta-outline'; ?>"><?php echo esc_html( $cta_text ); ?></a>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- ===== TIME WASTE ===== -->
<section class="section section-alt" aria-label="<?php esc_attr_e( 'Time Savings', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>How Much Time Are You <span class="highlight">Wasting?</span></h2>
        </div>
        <div class="time-grid">
            <div class="time-card fade-in-up">
                <div class="time-card-value">15+</div>
                <div class="time-card-label">Hours/week<br>managing multiple client accounts</div>
            </div>
            <div class="time-card fade-in-up">
                <div class="time-card-value">10+</div>
                <div class="time-card-label">Hours/week<br>on legal research alone</div>
            </div>
            <div class="time-card fade-in-up">
                <div class="time-card-value">8+</div>
                <div class="time-card-label">Hours/week<br>hunting for case precedents</div>
            </div>
            <div class="time-card fade-in-up">
                <div class="time-card-value">12+</div>
                <div class="time-card-label">Hours/week<br>drafting and reviewing documents</div>
            </div>
        </div>
        <div style="text-align: center; margin-top: 40px;">
            <p style="font-size: 18px; color: var(--text-secondary); margin-bottom: 24px;">Get that time back.<br>Start with CaseFiles today.</p>
            <a href="<?php echo esc_url( $hero_cta_url ); ?>" class="btn-hero btn-hero-primary">Get Started Free</a>
        </div>
    </div>
</section>

<!-- ===== FAQ ===== -->
<section class="section" id="faq" aria-label="<?php esc_attr_e( 'FAQ', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>Frequently Asked <span class="highlight">Questions</span></h2>
            <p>Everything you need to know about CaseFiles.</p>
        </div>
        <div class="faq-list">
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    How is CaseFiles different from ChatGPT?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">CaseFiles is purpose-built for legal practice. Unlike generic AI tools, it understands Indian law, integrates with eCourts, generates GST-compliant invoices, and learns your specific practice area and case patterns over time.</div>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    Do I need to connect my court accounts?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">No. CaseFiles works standalone. You can manually enter court dates or use our eCourts integration to auto-sync cause lists and hearing schedules when you're ready.</div>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    How does CaseFiles learn my practice area?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">During onboarding, you tell us your practice areas (e.g., criminal, corporate, family law). The AI then tailors research results, document templates, and suggestions specifically to your niche.</div>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    Is there a free plan?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">Yes! The Free plan includes 3 active cases, 1 user, 100 MB storage, and 5 AI queries per month. No credit card required to start.</div>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    Can I use CaseFiles for multiple clients or branches?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">Absolutely. The Firm and Enterprise plans support multiple users, branches, and client management. You can organize cases by client, branch, or practice area.</div>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    How fast can I generate a document?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">Most documents are generated in under 30 seconds. Simply select the document type, provide case details, and CaseFiles creates a professional, jurisdiction-specific draft.</div>
                </div>
            </div>
            <div class="faq-item">
                <button class="faq-question" aria-expanded="false">
                    Can I cancel my subscription anytime?
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="faq-answer">
                    <div class="faq-answer-inner">Yes. You can cancel anytime from your dashboard. Your plan stays active until the end of the billing period. No lock-in, no questions asked.</div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- ===== BLOG PREVIEW ===== -->
<section class="section section-alt" id="blog" aria-label="<?php esc_attr_e( 'Latest from the Blog', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <div class="section-header">
            <h2>Latest from the <span class="highlight">Blog</span></h2>
            <p>Tips, updates, and insights for Indian lawyers.</p>
        </div>
        <div class="product-grid">
            <?php
            $blog_posts = new WP_Query( array(
                'posts_per_page' => 3,
                'post_status'    => 'publish',
            ) );
            if ( $blog_posts->have_posts() ) :
                while ( $blog_posts->have_posts() ) : $blog_posts->the_post();
            ?>
                <a href="<?php the_permalink(); ?>" class="product-card fade-in-up" style="text-decoration: none;">
                    <?php if ( has_post_thumbnail() ) : ?>
                        <div style="margin: -28px -28px 20px -28px; border-radius: var(--radius) var(--radius) 0 0; overflow: hidden; height: 160px;">
                            <?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy', 'style' => 'width:100%;height:100%;object-fit:cover;' ) ); ?>
                        </div>
                    <?php endif; ?>
                    <div class="blog-card-meta" style="margin-bottom: 8px;">
                        <span><?php echo get_the_date(); ?></span>
                        <span class="blog-card-sep">&middot;</span>
                        <?php the_category( ', ' ); ?>
                    </div>
                    <h3 style="font-size: 17px; font-weight: 700; margin-bottom: 8px; color: var(--text);"><?php the_title(); ?></h3>
                    <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7;"><?php echo wp_trim_words( get_the_excerpt(), 20 ); ?></p>
                </a>
            <?php
                endwhile;
                wp_reset_postdata();
            else :
            ?>
                <div class="product-card">
                    <h3>Coming Soon</h3>
                    <p>We're working on helpful articles. Check back soon!</p>
                </div>
            <?php endif; ?>
        </div>
        <div style="text-align: center; margin-top: 40px;">
            <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="btn-hero btn-hero-outline">View All Posts</a>
        </div>
    </div>
</section>

<!-- ===== CTA ===== -->
<section class="cta-section" aria-label="<?php esc_attr_e( 'Call to Action', 'casefiles-theme' ); ?>">
    <div class="section-inner">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent); margin-bottom: 24px;">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
        </svg>
        <h2><?php echo esc_html( $cta_heading ); ?></h2>
        <p><?php echo esc_html( $cta_desc ); ?></p>
        <div class="hero-actions">
            <a href="<?php echo esc_url( $hero_cta_url ); ?>" class="btn-hero btn-hero-primary">
                <?php echo esc_html( $hero_cta_text ); ?>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
        </div>
        <p class="hero-note">No credit card required &middot; Free forever plan available</p>
    </div>
</section>
</main>

<?php get_footer(); ?>
