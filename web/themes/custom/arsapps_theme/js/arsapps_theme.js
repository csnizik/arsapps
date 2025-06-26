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
   * Enhanced Layout Builder accessibility.
   */
  Drupal.behaviors.arsappsLayoutBuilderA11y = {
    attach: function (context, settings) {
      once('layout-builder-a11y', '.layout-builder__section', context).forEach(function (section) {
        // Add ARIA labels for screen readers
        if (!section.getAttribute('aria-label')) {
          section.setAttribute('aria-label', 'Content Section');
        }
        
        // Improve keyboard navigation
        section.setAttribute('tabindex', '0');
        section.addEventListener('keydown', function(event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            // Focus on first interactive element
            const firstButton = section.querySelector('button, a, input, select, textarea');
            if (firstButton) {
              firstButton.focus();
            }
          }
        });
        
        console.log('Enhanced accessibility for layout section');
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