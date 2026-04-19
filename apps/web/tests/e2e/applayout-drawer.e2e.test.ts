import { expect, test } from '@playwright/test'

test.describe('AppLayout — drawer mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('le bouton burger toggle aria-expanded et ouvre la Sidebar', async ({ page }) => {
    await page.goto('/')

    const burger = page.getByRole('button', { name: /basculer la navigation/i })
    const sidebar = page.getByRole('navigation', { name: /navigation principale/i })

    await expect(burger).toBeVisible()
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await expect(sidebar).toHaveAttribute('data-open', 'false')

    await burger.click()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')
    await expect(sidebar).toHaveAttribute('data-open', 'true')

    await burger.click()
    await expect(burger).toHaveAttribute('aria-expanded', 'false')
    await expect(sidebar).toHaveAttribute('data-open', 'false')
  })
})

test.describe('AppLayout — desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('la Sidebar est toujours visible et le burger est cache', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('navigation', { name: /navigation principale/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /basculer la navigation/i })).toBeHidden()
  })
})
