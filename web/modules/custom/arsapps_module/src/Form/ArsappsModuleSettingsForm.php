<?php

declare(strict_types=1);

namespace Drupal\arsapps_module\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure ARSApps Module settings for this site.
 */
final class ArsappsModuleSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'arsapps_module_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return ['arsapps_module.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config('arsapps_module.settings');

    $form['example_text'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Example text field'),
      '#default_value' => $config->get('example_text'),
      '#description' => $this->t('This is a placeholder text field for testing purposes.'),
      '#maxlength' => 255,
    ];

    $form['example_number'] = [
      '#type' => 'number',
      '#title' => $this->t('Example number field'),
      '#default_value' => $config->get('example_number'),
      '#description' => $this->t('This is a placeholder number field for testing purposes.'),
      '#min' => 0,
      '#max' => 100,
    ];

    $form['example_boolean'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Example boolean field'),
      '#default_value' => $config->get('example_boolean'),
      '#description' => $this->t('This is a placeholder boolean field for testing purposes.'),
    ];

    $form['example_textarea'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Example textarea field'),
      '#default_value' => $config->get('example_textarea'),
      '#description' => $this->t('This is a placeholder textarea field for testing purposes.'),
      '#rows' => 4,
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->config('arsapps_module.settings')
      ->set('example_text', $form_state->getValue('example_text'))
      ->set('example_number', $form_state->getValue('example_number'))
      ->set('example_boolean', $form_state->getValue('example_boolean'))
      ->set('example_textarea', $form_state->getValue('example_textarea'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}