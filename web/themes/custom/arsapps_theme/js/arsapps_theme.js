/**
 * @file
 * ARSApps Theme JavaScript behaviors.
 */

(function (Drupal, once) {
  'use strict';

  /**
   * Theme initialization behavior.
   */
  Drupal.behaviors.arsappsTheme = {
    attach: function (context, settings) {
      // Initialize theme-specific JavaScript here
      once('arsapps-theme-init', 'html', context).forEach(function (element) {
        console.log('ARSApps Theme initialized');
        
        // Add any theme-specific JavaScript functionality here
        // For example: mobile menu toggles, smooth scrolling, etc.
      });
    }
  };

  /**
   * Mobile menu toggle example.
   */
  Drupal.behaviors.arsappsMobileMenu = {
    attach: function (context, settings) {
      once('mobile-menu', '.mobile-menu-toggle', context).forEach(function (toggle) {
        toggle.addEventListener('click', function (e) {
          e.preventDefault();
          const menu = document.querySelector('.primary-menu');
          if (menu) {
            menu.classList.toggle('is-open');
            this.classList.toggle('is-active');
          }
        });
      });
    }
  };

})(Drupal, once);