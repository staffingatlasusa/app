<?php
/**
 * Template Name: SA Register Contractor
 *
 * Contractor registration has moved to staffingatlas.online.
 * This template performs an immediate redirect — no PHP output, no WP head.
 */

// Redirect to SaaS signup (contractor onboarding flow)
wp_redirect( 'https://staffingatlas.online/auth/signup?role=contractor', 301 );
exit;
