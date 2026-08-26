<?php
/**
 * CaseFiles Theme Functions
 *
 * @package CaseFiles
 * @version 3.0.0
 */

if ( ! defined( 'ABSPATH' ) ) exit;

define( 'CASEFILES_VERSION', '3.0.0' );
define( 'CASEFILES_DIR', get_template_directory() );
define( 'CASEFILES_URI', get_template_directory_uri() );

/**
 * Theme Setup
 */
function casefiles_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'custom-logo', array(
        'height'      => 60,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ) );
    add_theme_support( 'html5', array(
        'search-form', 'comment-form', 'comment-list', 'gallery', 'caption',
    ) );

    add_theme_support( 'align-wide' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'editor-styles' );
    add_theme_support( 'customize-selective-refresh-widgets' );
    add_theme_support( 'automatic-feed-links' );

    register_nav_menus( array(
        'primary' => __( 'Primary Navigation', 'casefiles-theme' ),
        'footer'  => __( 'Footer Navigation', 'casefiles-theme' ),
    ) );
}
add_action( 'after_setup_theme', 'casefiles_setup' );

/**
 * Elementor: Register widget locations
 */
function casefiles_elementor_locations( $manager ) {
    $manager->register_all_core_locations();
}
add_action( 'elementor/theme/register_locations', 'casefiles_elementor_locations' );

/**
 * Elementor: Add custom CSS class to body when Elementor is active
 */
function casefiles_elementor_body_class( $classes ) {
    if ( class_exists( '\Elementor\Plugin' ) && \Elementor\Plugin::$instance->preview->is_preview_mode() ) {
        $classes[] = 'elementor-preview';
    }
    return $classes;
}
add_filter( 'body_class', 'casefiles_elementor_body_class' );

/**
 * Elementor: Register custom widget areas for Elementor
 */
function casefiles_elementor_widget_areas() {
    $sections = array(
        'hero'       => array(
            'name'      => __( 'Hero Section', 'casefiles-theme' ),
            'id'        => 'hero-section',
            'description' => __( 'Main hero area on front page', 'casefiles-theme' ),
        ),
        'features'   => array(
            'name'      => __( 'Features Section', 'casefiles-theme' ),
            'id'        => 'features-section',
            'description' => __( 'Product features grid', 'casefiles-theme' ),
        ),
        'cta'        => array(
            'name'      => __( 'CTA Section', 'casefiles-theme' ),
            'id'        => 'cta-section',
            'description' => __( 'Call to action area', 'casefiles-theme' ),
        ),
    );

    foreach ( $sections as $section ) {
        register_sidebar( array(
            'name'          => $section['name'],
            'id'            => $section['id'],
            'description'   => $section['description'],
            'before_widget' => '<div class="elementor-widget-area-item %2$s">',
            'after_widget'  => '</div>',
            'before_title'  => '<h2 class="widget-title screen-reader-text">',
            'after_title'   => '</h2>',
        ) );
    }
}
add_action( 'widgets_init', 'casefiles_elementor_widget_areas', 20 );

/**
 * Enqueue Scripts and Styles
 */
function casefiles_scripts() {
    wp_enqueue_style( 'casefiles-style', get_stylesheet_uri(), array(), CASEFILES_VERSION );

    wp_register_script( 'casefiles-main', CASEFILES_URI . '/js/main.js', array(), CASEFILES_VERSION, true );
    wp_script_add_data( 'casefiles-main', 'defer', true );
    wp_enqueue_script( 'casefiles-main' );

    wp_register_script( 'casefiles-a11y', CASEFILES_URI . '/js/accessibility.js', array(), CASEFILES_VERSION, true );
    wp_script_add_data( 'casefiles-a11y', 'defer', true );
    wp_enqueue_script( 'casefiles-a11y' );

    if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
        wp_enqueue_script( 'comment-reply' );
    }
}
add_action( 'wp_enqueue_scripts', 'casefiles_scripts' );

/**
 * Add resource hints for performance
 */
function casefiles_resource_hints( $urls, $relation_type ) {
    if ( 'preconnect' === $relation_type ) {
        $urls[] = array(
            'href' => 'https://fonts.googleapis.com',
            'crossorigin' => 'anonymous',
        );
    }
    return $urls;
}
add_filter( 'wp_resource_hints', 'casefiles_resource_hints', 10, 2 );

/**
 * Remove unnecessary WordPress defaults for speed
 */
function casefiles_cleanup_head() {
    remove_action( 'wp_head', 'wp_generator' );
    remove_action( 'wp_head', 'wlwmanifest_link' );
    remove_action( 'wp_head', 'rsd_link' );
    remove_action( 'wp_head', 'wp_shortlink_wp_head' );
    remove_action( 'wp_head', 'rest_output_link_wp_head' );
    remove_action( 'wp_head', 'wp_oembed_add_discovery_links' );
    remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
    remove_action( 'wp_print_styles', 'print_emoji_styles' );
}
add_action( 'init', 'casefiles_cleanup_head' );

/**
 * Add loading="lazy" to images below the fold
 */
function casefiles_lazy_load_images( $content ) {
    if ( is_admin() ) {
        return $content;
    }
    return str_replace( '<img ', '<img loading="lazy" ', $content );
}
add_filter( 'the_content', 'casefiles_lazy_load_images' );

/**
 * Customizer Settings
 */
function casefiles_customize_register( $wp_customize ) {
    // App URL Settings
    $wp_customize->add_section( 'casefiles_app', array(
        'title'    => __( 'App Links (Sign In / Sign Up)', 'casefiles-theme' ),
        'priority' => 25,
    ) );

    $wp_customize->add_setting( 'app_login_url', array(
        'default'           => 'https://lawapp-eight.vercel.app/auth/login',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( 'app_login_url', array(
        'label'   => __( 'Sign In URL', 'casefiles-theme' ),
        'section' => 'casefiles_app',
        'type'    => 'url',
    ) );

    $wp_customize->add_setting( 'app_signup_url', array(
        'default'           => 'https://lawapp-eight.vercel.app/auth/signup',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( 'app_signup_url', array(
        'label'   => __( 'Sign Up URL', 'casefiles-theme' ),
        'section' => 'casefiles_app',
        'type'    => 'url',
    ) );

    // Hero Section
    $wp_customize->add_section( 'casefiles_hero', array(
        'title'    => __( 'Hero Section', 'casefiles-theme' ),
        'priority' => 30,
    ) );

    $wp_customize->add_setting( 'hero_badge_text', array(
        'default'           => 'Built for Indian Lawyers',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'hero_badge_text', array(
        'label'   => __( 'Hero Badge Text', 'casefiles-theme' ),
        'section' => 'casefiles_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'hero_heading', array(
        'default'           => 'The Legal Practice Engine for Indian Lawyers',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'hero_heading', array(
        'label'   => __( 'Hero Heading', 'casefiles-theme' ),
        'section' => 'casefiles_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'hero_description', array(
        'default'           => 'Turn hours of manual research into minutes. Let AI find case laws, draft documents and manage your practice so you can get back to arguing.',
        'sanitize_callback' => 'sanitize_textarea_field',
    ) );
    $wp_customize->add_control( 'hero_description', array(
        'label'   => __( 'Hero Description', 'casefiles-theme' ),
        'section' => 'casefiles_hero',
        'type'    => 'textarea',
    ) );

    $wp_customize->add_setting( 'hero_cta_text', array(
        'default'           => 'Start Free Trial',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'hero_cta_text', array(
        'label'   => __( 'Hero CTA Button Text', 'casefiles-theme' ),
        'section' => 'casefiles_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'hero_cta_url', array(
        'default'           => '#',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( 'hero_cta_url', array(
        'label'   => __( 'Hero CTA Button URL', 'casefiles-theme' ),
        'section' => 'casefiles_hero',
        'type'    => 'url',
    ) );

    // Stats Section
    $wp_customize->add_section( 'casefiles_stats', array(
        'title'    => __( 'Stats Section', 'casefiles-theme' ),
        'priority' => 35,
    ) );

    $stats = array(
        array( 'key' => 'stat1_value', 'label' => 'Stat 1 Value', 'default' => '2,500+' ),
        array( 'key' => 'stat1_label', 'label' => 'Stat 1 Label', 'default' => 'Lawyers Trust CaseFiles' ),
        array( 'key' => 'stat2_value', 'label' => 'Stat 2 Value', 'default' => '15,000+' ),
        array( 'key' => 'stat2_label', 'label' => 'Stat 2 Label', 'default' => 'Cases Managed' ),
        array( 'key' => 'stat3_value', 'label' => 'Stat 3 Value', 'default' => '99.9%' ),
        array( 'key' => 'stat3_label', 'label' => 'Stat 3 Label', 'default' => 'Uptime SLA' ),
        array( 'key' => 'stat4_value', 'label' => 'Stat 4 Value', 'default' => '4.9/5' ),
        array( 'key' => 'stat4_label', 'label' => 'Stat 4 Label', 'default' => 'Client Rating' ),
    );

    foreach ( $stats as $stat ) {
        $wp_customize->add_setting( $stat['key'], array(
            'default'           => $stat['default'],
            'sanitize_callback' => 'sanitize_text_field',
        ) );
        $wp_customize->add_control( $stat['key'], array(
            'label'   => $stat['label'],
            'section' => 'casefiles_stats',
            'type'    => 'text',
        ) );
    }

    // CTA Section
    $wp_customize->add_section( 'casefiles_cta', array(
        'title'    => __( 'CTA Section', 'casefiles-theme' ),
        'priority' => 40,
    ) );

    $wp_customize->add_setting( 'cta_heading', array(
        'default'           => 'Ready to Transform Your Practice?',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'cta_heading', array(
        'label'   => __( 'CTA Heading', 'casefiles-theme' ),
        'section' => 'casefiles_cta',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'cta_description', array(
        'default'           => 'Join 2,500+ lawyers who manage their entire practice with CaseFiles.',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'cta_description', array(
        'label'   => __( 'CTA Description', 'casefiles-theme' ),
        'section' => 'casefiles_cta',
        'type'    => 'text',
    ) );

    // Footer
    $wp_customize->add_section( 'casefiles_footer', array(
        'title'    => __( 'Footer Settings', 'casefiles-theme' ),
        'priority' => 45,
    ) );

    $wp_customize->add_setting( 'footer_copyright', array(
        'default'           => '&copy; 2026 CaseFiles. All rights reserved.',
        'sanitize_callback' => 'sanitize_text_field',
    ) );
    $wp_customize->add_control( 'footer_copyright', array(
        'label'   => __( 'Copyright Text', 'casefiles-theme' ),
        'section' => 'casefiles_footer',
        'type'    => 'text',
    ) );
}
add_action( 'customize_register', 'casefiles_customize_register' );

/**
 * Helper: Get Customizer value with fallback
 */
function casefiles_get( $key, $default = '' ) {
    return get_theme_mod( $key, $default );
}

/**
 * Register Sidebar Widget Areas
 */
function casefiles_widgets_init() {
    register_sidebar( array(
        'name'          => __( 'Blog Sidebar', 'casefiles-theme' ),
        'id'            => 'sidebar-blog',
        'description'   => __( 'Widgets added here appear on the blog page.', 'casefiles-theme' ),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ) );

    register_sidebar( array(
        'name'          => __( 'Footer Widgets', 'casefiles-theme' ),
        'id'            => 'footer-widgets',
        'description'   => __( 'Widgets in the footer area.', 'casefiles-theme' ),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ) );

    register_sidebar( array(
        'name'          => __( 'Header Widget Area', 'casefiles-theme' ),
        'id'            => 'header-widgets',
        'description'   => __( 'Widgets in the header area.', 'casefiles-theme' ),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title screen-reader-text">',
        'after_title'   => '</h3>',
    ) );
}
add_action( 'widgets_init', 'casefiles_widgets_init' );

/**
 * Get author bio data
 */
function casefiles_get_author_bio( $author_id = null ) {
    if ( ! $author_id ) {
        $author_id = get_the_author_meta( 'ID' );
    }
    return array(
        'name'        => get_the_author_meta( 'display_name', $author_id ),
        'description' => get_the_author_meta( 'description', $author_id ),
        'avatar'      => get_avatar_url( $author_id, array( 'size' => 80 ) ),
        'url'         => get_author_posts_url( $author_id ),
    );
}

/**
 * Fetch subscription plans from Supabase
 */
function casefiles_get_pricing_plans() {
    $cache_key = 'casefiles_pricing_plans';
    $cached = get_transient( $cache_key );
    if ( false !== $cached ) {
        return $cached;
    }

    $supabase_url = 'https://dsqlpoepaprirwlyfoaj.supabase.co';
    $anon_key    = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcWxwb2VwYXByaXJ3bHlmb2FqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwNjcyODIsImV4cCI6MjEwMDY0MzI4Mn0.qopjqCn5-rjPs2lsSwmyIY6aV4GYxXL_Z-Fk2hfyrDE';

    $response = wp_remote_get(
        $supabase_url . '/rest/v1/subscription_plans?select=*&is_active=eq.true&order=price',
        array(
            'headers' => array(
                'apikey'        => $anon_key,
                'Authorization' => 'Bearer ' . $anon_key,
                'Content-Type'  => 'application/json',
            ),
            'timeout' => 10,
        )
    );

    if ( is_wp_error( $response ) ) {
        return casefiles_get_fallback_plans();
    }

    $code = wp_remote_retrieve_response_code( $response );
    if ( 200 !== $code ) {
        return casefiles_get_fallback_plans();
    }

    $body = json_decode( wp_remote_retrieve_body( $response ), true );
    if ( empty( $body ) || ! is_array( $body ) ) {
        return casefiles_get_fallback_plans();
    }

    set_transient( $cache_key, $body, HOUR_IN_SECONDS );
    return $body;
}

/**
 * Fallback plans if Supabase is unreachable
 */
function casefiles_get_fallback_plans() {
    return array(
        array(
            'name'          => 'Free',
            'slug'          => 'free',
            'price'         => 0,
            'max_cases'     => 10,
            'max_users'     => 10,
            'max_storage_mb'=> 500,
            'features'      => array( '10 active cases', '10 users', '500 MB storage', '10 AI queries/month' ),
            'cta_text'      => 'Get Started',
            'cta_url'       => '#',
            'highlighted'   => false,
        ),
        array(
            'name'          => 'Solo',
            'slug'          => 'solo',
            'price'         => 499,
            'max_cases'     => 30,
            'max_users'     => 3,
            'max_storage_mb'=> 1024,
            'features'      => array( '30 active cases', '3 users', '1 GB storage', 'E-filing integration', 'Invoice generation', '50 AI queries/month' ),
            'cta_text'      => 'Start 14-Day Trial',
            'cta_url'       => '#',
            'highlighted'   => false,
        ),
        array(
            'name'          => 'Professional',
            'slug'          => 'professional',
            'price'         => 799,
            'max_cases'     => -1,
            'max_users'     => 3,
            'max_storage_mb'=> 5120,
            'features'      => array( 'Unlimited cases', '3 users included', '5 GB storage', 'AI research & drafting', 'Full client portal', 'GST invoicing', 'Priority support' ),
            'cta_text'      => 'Start 14-Day Trial',
            'cta_url'       => '#',
            'highlighted'   => true,
            'badge'         => 'Most Popular',
        ),
        array(
            'name'          => 'Firm',
            'slug'          => 'firm',
            'price'         => 1999,
            'max_cases'     => -1,
            'max_users'     => 10,
            'max_storage_mb'=> 20480,
            'features'      => array( 'Unlimited cases', '10 users included', '20 GB storage', 'Admin controls', 'Custom reports', 'Audit logging' ),
            'cta_text'      => 'Start 14-Day Trial',
            'cta_url'       => '#',
            'highlighted'   => false,
        ),
        array(
            'name'          => 'Enterprise',
            'slug'          => 'enterprise',
            'price'         => 4999,
            'max_cases'     => -1,
            'max_users'     => -1,
            'max_storage_mb'=> -1,
            'features'      => array( 'Unlimited everything', 'Unlimited users', 'Unlimited storage', 'Dedicated account manager', 'Custom integrations', 'White-label options' ),
            'cta_text'      => 'Contact Sales',
            'cta_url'       => '#',
            'highlighted'   => false,
        ),
    );
}

/**
 * Format storage size from MB
 */
function casefiles_format_storage( $mb ) {
    if ( $mb < 0 ) return 'Unlimited';
    if ( $mb >= 1024 ) return round( $mb / 1024 ) . ' GB';
    return $mb . ' MB';
}

/**
 * Format user count
 */
function casefiles_format_users( $count ) {
    if ( $count < 0 ) return 'Unlimited';
    return $count . ' user' . ( $count !== 1 ? 's' : '' );
}

/**
 * Format case count
 */
function casefiles_format_cases( $count ) {
    if ( $count < 0 ) return 'Unlimited';
    return $count . ' active case' . ( $count !== 1 ? 's' : '' );
}

/**
 * Get related posts
 */
function casefiles_get_related_posts( $post_id = null, $count = 3 ) {
    if ( ! $post_id ) {
        $post_id = get_the_ID();
    }

    $categories = get_the_category( $post_id );
    if ( empty( $categories ) ) {
        return array();
    }

    $category_ids = wp_list_pluck( $categories, 'term_id' );

    $related = new WP_Query( array(
        'category__in'   => $category_ids,
        'post__not_in'   => array( $post_id ),
        'posts_per_page' => $count,
        'orderby'        => 'rand',
        'post_status'    => 'publish',
    ) );

    return $related->posts;
}
