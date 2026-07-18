# Frontend CSS Architecture & Style Naming Conventions

This project uses modular styling split into organized partial stylesheets under the `frontend/src/styles/` directory, imported by a unified compiler entry point in `frontend/src/index.css`.

## CSS Structure

The styles are partitioned as follows:
* **`_variables.css`**: Design tokens, variables (HSL theme colors), responsive break-point custom properties, and dark mode media query overrides.
* **`_base.css`**: Tag resets, system fonts, defaults for links, typography elements, and baseline margins.
* **`_layout.css`**: Page frames, flex/grid wrap classes, header/footer elements, and global structural containers.
* **`_components.css`**: Spinners, buttons, notification dropdown elements, and global reusable controls. Contains the **Visual Regression Chaos Mode** style definitions.
* **`_pages.css`**: Dedicated class layouts for separate views (Login, Catalog grid, Cart list, Profile details, Checkout wizard steps).

---

## Class Naming & QA Challenge Selectors

We follow two sets of CSS classes to support the target QA practice objective:

### 1. Standard Production Styles (BEM)
New components and visual styles should be written using the standard **BEM (Block-Element-Modifier)** convention for readability and structural co-location:
* **Block**: `.auth-card`
* **Element**: `.auth-card__input`
* **Modifier**: `.auth-card__input--disabled`

### 2. Tricky QA Testing Selectors (Preserved)
To challenge QA automation engineers writing E2E suites (Playwright/Selenium), this application deliberately preserves several randomized, obfuscated, and non-semantic class names and element IDs.

> [!WARNING]
> Do NOT remove or modify these legacy selectors during front-end refactoring as it will break downstream E2E assertion coverage:

* **Catalog Layout Grid**: `.layout-wrapper-xyz987`
* **Book Container Item**: `.complex-item-box-alpha`
* **Cover Image Cell**: `.image-cell-omega`
* **Info Content Frame**: `.info-cell-beta`
* **Book Card Title**: `.title-variant-2`
* **Book Price Label**: `.price-tag-value`
* **Checkout Input Blocks**: `.input-group-rnd-9182`
* **Wizard Step Content**: `#wizard-step-1`, `#wizard-step-2`, `#wizard-step-3`
