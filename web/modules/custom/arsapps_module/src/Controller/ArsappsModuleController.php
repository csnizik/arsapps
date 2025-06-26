<?php

declare(strict_types=1);

namespace Drupal\arsapps_module\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Returns responses for ARSApps Module routes.
 */
final class ArsappsModuleController extends ControllerBase {

  /**
   * Builds the response for the info page.
   */
  public function info(): array {
    $build = [];

    $build['content'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['arsapps-module-info']],
    ];

    $build['content']['header'] = [
      '#type' => 'html_tag',
      '#tag' => 'h2',
      '#value' => $this->t('ARSApps Module Information'),
    ];

    $build['content']['description'] = [
      '#type' => 'html_tag',
      '#tag' => 'p',
      '#value' => $this->t('This is a placeholder module for ARSApps projects. It provides basic functionality for testing and development purposes.'),
    ];

    $build['content']['features'] = [
      '#type' => 'html_tag',
      '#tag' => 'h3',
      '#value' => $this->t('Features'),
    ];

    $build['content']['features_list'] = [
      '#theme' => 'item_list',
      '#items' => [
        $this->t('Configuration form'),
        $this->t('Block plugin'),
        $this->t('Help page integration'),
        $this->t('Basic routing'),
        $this->t('Configuration schema'),
      ],
    ];

    $build['content']['links'] = [
      '#type' => 'html_tag',
      '#tag' => 'p',
    ];

    $build['content']['links']['settings_link'] = [
      '#type' => 'link',
      '#title' => $this->t('Module Settings'),
      '#url' => \Drupal\Core\Url::fromRoute('arsapps_module.settings'),
      '#attributes' => ['class' => ['button']],
    ];

    return $build;
  }

}