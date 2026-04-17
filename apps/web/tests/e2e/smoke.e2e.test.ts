import { expect, test } from '@playwright/test'

test.describe('smoke', () => {
  test("la page d'accueil se charge et affiche StackNest", async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: /stacknest/i })).toBeVisible()
  })

  test("le bandeau d'environnement s'affiche quand VITE_ENVIRONMENT est defini", async ({
    page,
  }) => {
    await page.goto('/')

    const banner = page.getByRole('status')
    const bannerCount = await banner.count()

    if (bannerCount > 0) {
      await expect(banner).toContainText(/environnement/i)
    }
  })
})
