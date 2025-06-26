<?php

declare(strict_types=1);

namespace Drupal\arsapps_module\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Provides an ARSApps Module block.
 */
#[Block(
  id: 'arsapps_module_block',
  admin_label: new TranslatableMarkup('ARSApps Module Block'),
  category: new TranslatableMarkup('Custom'),
)]
final class ArsappsModuleBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $build = [];
    $build['content'] = [
      '#markup' => $this->t('This is a placeholder block from ARSApps Module. It demonstrates basic block plugin functionality for testing and development purposes.'),
      '#prefix' => '<div class="arsapps-module-block">',
      '#suffix' => '</div>',
    ];

    return $build;
  }

}