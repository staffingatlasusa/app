<?php
/**
 * Template Name: SA Edit Profile
 *
 * Profile editing has moved to staffingatlas.online.
 * This template performs an immediate redirect — preserves login state via URL param.
 */

// If WP user is logged in, pass their email as a hint so SA.online can pre-fill
$hint = '';
if ( is_user_logged_in() ) {
    $user = wp_get_current_user();
    $hint = '?email=' . rawurlencode( $user->user_email );
}

wp_redirect( 'https://staffingatlas.online/dashboard/profile' . $hint, 301 );
exit;
