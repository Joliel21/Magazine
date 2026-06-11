<?php
/**
 * Plugin Name: The Words We Carry
 * Plugin URI:  https://breathtakingawareness.com/
 * Description: A shortcode to display The Words We Carry digital magazine viewer.
 * Version:     1.0.3
 * Author:      Breathtaking Awareness
 * License:     GPL-2.0+
 */

if ( ! defined( 'WPINC' ) ) {
	die;
}

define( 'THE_WORDS_WE_CARRY_VERSION', '1.0.3' );
define( 'THE_WORDS_WE_CARRY_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'THE_WORDS_WE_CARRY_PLUGIN_PATH', plugin_dir_path( __FILE__ ) );
define( 'THE_WORDS_WE_CARRY_SCRIPT_HANDLE', 'the-words-we-carry-script' );
define( 'THE_WORDS_WE_CARRY_STYLE_HANDLE', 'the-words-we-carry-style' );
define( 'THE_WORDS_WE_CARRY_DEFAULT_MAGAZINE_URL', 'https://joliel21.github.io/Magazine/' );
define( 'THE_WORDS_WE_CARRY_DEFAULT_CONTENT_BASE_URL', 'https://raw.githubusercontent.com/Joliel21/Magazine/main/public/' );

/**
 * Register shortcode:
 *
 * [the_words_we_carry]
 *
 * Optional overrides:
 * [the_words_we_carry content_base="https://raw.githubusercontent.com/Joliel21/Magazine/main/public/"]
 * [the_words_we_carry magazine_url="https://joliel21.github.io/Magazine/"]
 * [the_words_we_carry articles_url="https://example.com/content/articles.json" chapters_url="https://example.com/content/chapters.json"]
 * [the_words_we_carry config="https://example.com/publish_manifest.json"]
 */
add_shortcode( 'the_words_we_carry', 'the_words_we_carry_shortcode' );

function the_words_we_carry_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'config'       => '',
			'content_base' => THE_WORDS_WE_CARRY_DEFAULT_CONTENT_BASE_URL,
			'magazine_url' => THE_WORDS_WE_CARRY_DEFAULT_MAGAZINE_URL,
			'articles_url' => '',
			'chapters_url' => '',
		),
		$atts,
		'the_words_we_carry'
	);

	the_words_we_carry_enqueue_assets( $atts );

	return '<div id="the-words-we-carry-root" class="the-words-we-carry-root" style="width:100%;height:100%;min-height:660px;"></div>';
}

function the_words_we_carry_enqueue_assets( $atts = array() ) {
	$css_file = THE_WORDS_WE_CARRY_PLUGIN_PATH . 'assets/the-words-we-carry.css';
	$css_url  = THE_WORDS_WE_CARRY_PLUGIN_URL . 'assets/the-words-we-carry.css';

	if ( file_exists( $css_file ) ) {
		wp_enqueue_style(
			THE_WORDS_WE_CARRY_STYLE_HANDLE,
			$css_url,
			array(),
			filemtime( $css_file )
		);
	}

	$js_file = THE_WORDS_WE_CARRY_PLUGIN_PATH . 'assets/the-words-we-carry.js';
	$js_url  = THE_WORDS_WE_CARRY_PLUGIN_URL . 'assets/the-words-we-carry.js';

	if ( file_exists( $js_file ) ) {
		wp_enqueue_script(
			THE_WORDS_WE_CARRY_SCRIPT_HANDLE,
			$js_url,
			array(),
			filemtime( $js_file ),
			true
		);

		wp_localize_script(
			THE_WORDS_WE_CARRY_SCRIPT_HANDLE,
			'theWordsWeCarryConfig',
			array(
				'configUrl'      => isset( $atts['config'] ) ? esc_url_raw( $atts['config'] ) : '',
				'contentBaseUrl' => isset( $atts['content_base'] ) ? esc_url_raw( $atts['content_base'] ) : THE_WORDS_WE_CARRY_DEFAULT_CONTENT_BASE_URL,
				'magazineUrl'    => isset( $atts['magazine_url'] ) ? esc_url_raw( $atts['magazine_url'] ) : THE_WORDS_WE_CARRY_DEFAULT_MAGAZINE_URL,
				'articlesUrl'    => isset( $atts['articles_url'] ) ? esc_url_raw( $atts['articles_url'] ) : '',
				'chaptersUrl'    => isset( $atts['chapters_url'] ) ? esc_url_raw( $atts['chapters_url'] ) : '',
			)
		);
	}
}

/**
 * Add type="module" to the built Vite script.
 */
add_filter( 'script_loader_tag', 'the_words_we_carry_add_module_type', 10, 3 );

function the_words_we_carry_add_module_type( $tag, $handle, $src ) {
	if ( THE_WORDS_WE_CARRY_SCRIPT_HANDLE !== $handle ) {
		return $tag;
	}

	return '<script type="module" src="' . esc_url( $src ) . '"></script>';
}
