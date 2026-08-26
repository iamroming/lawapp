<?php
/**
 * Template Name: Blog Page
 *
 * Displays blog posts on a dedicated page.
 *
 * @package CaseFiles
 */

get_header();
?>

<main id="primary" class="site-main blog-page">
    <div class="section" style="padding-top: 120px;">
        <div class="section-inner blog-layout">

            <div class="blog-posts">
                <div class="section-header" style="text-align: left; margin-bottom: 40px;">
                    <h2>Blog</h2>
                    <p style="margin-top: 8px; color: var(--text-secondary);">Latest updates, tips, and news from CaseFiles.</p>
                </div>

                <?php
                $blog_query = new WP_Query( array(
                    'post_type'      => 'post',
                    'post_status'    => 'publish',
                    'posts_per_page' => get_option( 'posts_per_page', 10 ),
                    'orderby'        => 'date',
                    'order'          => 'DESC',
                ) );

                if ( $blog_query->have_posts() ) :
                    while ( $blog_query->have_posts() ) : $blog_query->the_post();
                ?>
                    <article id="post-<?php the_ID(); ?>" <?php post_class( 'blog-card' ); ?>>
                        <?php if ( has_post_thumbnail() ) : ?>
                            <a href="<?php the_permalink(); ?>" class="blog-card-thumb">
                                <?php the_post_thumbnail( 'medium_large', array( 'loading' => 'lazy' ) ); ?>
                            </a>
                        <?php endif; ?>

                        <div class="blog-card-body">
                            <div class="blog-card-meta">
                                <span class="blog-card-date"><?php echo get_the_date(); ?></span>
                                <span class="blog-card-sep">&middot;</span>
                                <?php the_category( ', ' ); ?>
                                <?php if ( ! post_password_required() && comments_open() ) : ?>
                                    <span class="blog-card-sep">&middot;</span>
                                    <a href="<?php the_permalink(); ?>#comments" style="color: var(--text-muted); text-decoration: none;">
                                        <?php comments_number( '0 Comments', '1 Comment', '% Comments' ); ?>
                                    </a>
                                <?php endif; ?>
                            </div>

                            <h3 class="blog-card-title">
                                <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                            </h3>

                            <div class="blog-card-excerpt">
                                <?php the_excerpt(); ?>
                            </div>

                            <a href="<?php the_permalink(); ?>" class="blog-card-readmore">
                                Read more
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            </a>
                        </div>
                    </article>
                <?php
                    endwhile;

                    // Pagination
                    the_posts_pagination( array(
                        'prev_text' => '&laquo;',
                        'next_text' => '&raquo;',
                        'mid_size'  => 2,
                    ) );

                else :
                ?>
                    <div class="section-header">
                        <h2>Coming Soon</h2>
                        <p>No posts published yet. Check back soon!</p>
                    </div>
                <?php
                endif;

                wp_reset_postdata();
                ?>
            </div>

        </div>
    </div>
</main>

<?php
get_footer();
