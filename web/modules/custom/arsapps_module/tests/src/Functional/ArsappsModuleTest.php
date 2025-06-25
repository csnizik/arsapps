<?php

declare(strict_types=1);

namespace Drupal\Tests\arsapps_module\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests for ARSApps Module functionality.
 *
 * @group arsapps_module
 */
final class ArsappsModuleTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['arsapps_module'];

  /**
   * Tests the module installation.
   */
  public function testModuleInstallation(): void {
    $this->assertTrue(\Drupal::moduleHandler()->moduleExists('arsapps_module'));
  }

  /**
   * Tests the settings form.
   */
  public function testSettingsForm(): void {
    $admin_user = $this->drupalCreateUser(['administer site configuration']);
    $this->drupalLogin($admin_user);

    $this->drupalGet('/admin/config/system/arsapps-module');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('ARSApps Module Settings');
    $this->assertSession()->fieldExists('example_text');
    $this->assertSession()->fieldExists('example_number');
    $this->assertSession()->fieldExists('example_boolean');
  }

  /**
   * Tests the info page.
   */
  public function testInfoPage(): void {
    $user = $this->drupalCreateUser(['access content']);
    $this->drupalLogin($user);

    $this->drupalGet('/arsapps-module/info');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('ARSApps Module Information');
    $this->assertSession()->pageTextContains('placeholder module');
  }

  /**
   * Tests the block plugin.
   */
  public function testBlockPlugin(): void {
    $admin_user = $this->drupalCreateUser(['administer blocks']);
    $this->drupalLogin($admin_user);

    $this->drupalGet('/admin/structure/block');
    $this->assertSession()->statusCodeEquals(200);
    $this->clickLink('Place block');
    $this->assertSession()->pageTextContains('ARSApps Module Block');
  }

  /**
   * Tests the help page.
   */
  public function testHelpPage(): void {
    $admin_user = $this->drupalCreateUser(['access administration pages']);
    $this->drupalLogin($admin_user);

    $this->drupalGet('/admin/help/arsapps_module');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('About');
    $this->assertSession()->pageTextContains('ARSApps Module is a placeholder');
  }

  /**
   * Tests configuration schema.
   */
  public function testConfigurationSchema(): void {
    $config = \Drupal::config('arsapps_module.settings');
    $this->assertNotNull($config->get('example_text'));
    $this->assertNotNull($config->get('example_number'));
    $this->assertNotNull($config->get('example_boolean'));
  }

}